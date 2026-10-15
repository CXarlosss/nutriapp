-- ==============================================================================
-- 0015 · Corrección de Seguridad Multi-Tenant, InitPlan RLS y Limpieza DDL
-- Resuelve pool-leaking, previene caídas en db push y optimiza RLS a escala
-- ==============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. LIMPIEZA DE FIRMAS PREVIAS PARA PERMITIR db push SIN CONFLICTOS
-- ─────────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_diet_event_stream(text, int);
DROP FUNCTION IF EXISTS public.append_diet_event(text, int, text, jsonb, jsonb);
DROP FUNCTION IF EXISTS public.append_diet_event(text, int, text, jsonb, jsonb, uuid);
DROP FUNCTION IF EXISTS public.enqueue_outbox_event(text, text, text, jsonb, int);
DROP FUNCTION IF EXISTS public.enqueue_outbox_event(text, text, text, jsonb, int, uuid);
DROP FUNCTION IF EXISTS public.set_current_clinic(uuid);
DROP FUNCTION IF EXISTS public.current_user_clinic_id();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. SESIÓN SEGURA Y PREVENCIÓN DE POOL LEAKING (is_local = true)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_current_clinic(p_clinic_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- is_local = true asegura que el valor se destruye al finalizar la transacción
    -- impidiendo que conexiones reutilizadas por PgBouncer retengan el clinic_id
    PERFORM set_config('app.current_clinic_id', p_clinic_id::TEXT, true);
END;
$$;

-- Revocación de permisos públicos (Solo roles administrativos o de prueba)
REVOKE ALL ON FUNCTION public.set_current_clinic(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_current_clinic(UUID) TO service_role, postgres;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RESOLUCIÓN DE TENANT ULTRA-RÁPIDA Y BLINDADA
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.current_user_clinic_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clinic_id UUID;
    v_uid UUID;
BEGIN
    -- A) PRIORIDAD 1: Claims del JWT de Supabase (Zero Query / Ultra-rápido en producción)
    BEGIN
        v_clinic_id := NULLIF((current_setting('request.jwt.claims', true)::JSONB -> 'app_metadata' ->> 'clinic_id'), '')::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_clinic_id := NULL;
    END;

    IF v_clinic_id IS NOT NULL THEN
        RETURN v_clinic_id;
    END IF;

    -- B) PRIORIDAD 2: Lookup directo en user_profiles si el usuario está autenticado
    v_uid := auth.uid();
    IF v_uid IS NOT NULL THEN
        SELECT up.clinic_id INTO v_clinic_id
        FROM public.user_profiles up
        WHERE up.id = v_uid AND up.is_active = true
        LIMIT 1;

        IF v_clinic_id IS NOT NULL THEN
            RETURN v_clinic_id;
        END IF;

        -- Fallback a profiles legacy si existiera
        BEGIN
            SELECT p.clinic_id INTO v_clinic_id
            FROM public.profiles p
            WHERE p.id = v_uid
            LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            v_clinic_id := NULL;
        END;

        IF v_clinic_id IS NOT NULL THEN
            RETURN v_clinic_id;
        END IF;
    END IF;

    -- C) PRIORIDAD 3: Variable de sesión local (sólo válida en scripts de testing o procesos service_role)
    BEGIN
        v_clinic_id := NULLIF(current_setting('app.current_clinic_id', true), '')::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_clinic_id := NULL;
    END;

    RETURN v_clinic_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.current_user_clinic_id() TO authenticated, service_role, postgres;
REVOKE EXECUTE ON FUNCTION public.current_user_clinic_id() FROM anon, PUBLIC;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. SUPABASE CUSTOM ACCESS TOKEN HOOK (INYECCIÓN DE CLINIC_ID EN JWT)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_claims JSONB;
    v_user_id UUID;
    v_clinic_id UUID;
BEGIN
    v_claims := event->'claims';
    v_user_id := (event->>'user_id')::UUID;

    -- Buscar clinic_id en user_profiles
    SELECT clinic_id INTO v_clinic_id
    FROM public.user_profiles
    WHERE id = v_user_id AND is_active = true
    LIMIT 1;

    IF v_clinic_id IS NOT NULL THEN
        -- Inyectar clinic_id en app_metadata del JWT
        v_claims := jsonb_set(
            v_claims,
            '{app_metadata,clinic_id}',
            to_jsonb(v_clinic_id::TEXT)
        );
    END IF;

    -- Actualizar claims en el evento de Supabase
    event := jsonb_set(event, '{claims}', v_claims);
    RETURN event;
END;
$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
        GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(JSONB) TO supabase_auth_admin;
    END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(JSONB) TO service_role, postgres;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(JSONB) FROM authenticated, anon, PUBLIC;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RECREACIÓN DE FUNCIONES RPC LIMPIAS CON FIRMAS DEFINITIVAS
-- ─────────────────────────────────────────────────────────────────────────────

-- 5.1. get_diet_event_stream con columna clinic_id y tipo explícito
CREATE OR REPLACE FUNCTION public.get_diet_event_stream(
    p_stream_id TEXT,
    p_target_version INT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    stream_id TEXT,
    version INT,
    event_type TEXT,
    payload JSONB,
    metadata JSONB,
    clinic_id UUID,
    created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT
        e.id,
        e.stream_id,
        e.version,
        e.event_type,
        e.payload,
        e.metadata,
        e.clinic_id,
        e.created_at
    FROM public.diet_events e
    WHERE e.stream_id = p_stream_id
      AND (e.clinic_id IS NULL OR e.clinic_id = (SELECT public.current_user_clinic_id()))
      AND (p_target_version IS NULL OR e.version <= p_target_version)
    ORDER BY e.version ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_diet_event_stream(TEXT, INT) TO authenticated, service_role, postgres;

-- 5.2. append_diet_event
CREATE OR REPLACE FUNCTION public.append_diet_event(
    p_stream_id TEXT,
    p_expected_version INT,
    p_event_type TEXT,
    p_payload JSONB,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_clinic_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clinic_id UUID;
    v_existing_clinic_id UUID;
    v_current_version INT;
    v_new_version INT;
    v_event_id UUID;
    v_created_at TIMESTAMPTZ;
BEGIN
    v_clinic_id := COALESCE(p_clinic_id, (SELECT public.current_user_clinic_id()));

    SELECT clinic_id INTO v_existing_clinic_id
    FROM public.diet_events
    WHERE stream_id = p_stream_id
    LIMIT 1;

    IF v_existing_clinic_id IS NOT NULL THEN
        IF v_clinic_id IS NOT NULL AND v_existing_clinic_id != v_clinic_id THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'CrossTenantViolation: El stream clínico ' || p_stream_id || ' pertenece a otra clínica.'
            );
        END IF;
        v_clinic_id := v_existing_clinic_id;
    END IF;

    IF v_clinic_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'TenantError: No se ha podido resolver el clinic_id en el contexto actual.'
        );
    END IF;

    SELECT COALESCE(MAX(version), 0) INTO v_current_version
    FROM public.diet_events
    WHERE stream_id = p_stream_id;

    IF p_expected_version IS NOT NULL AND p_expected_version >= 0 AND v_current_version != p_expected_version THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'ConcurrencyConflict: Versión esperada (' || p_expected_version || ') distinta a versión actual (' || v_current_version || ').',
            'current_version', v_current_version,
            'expected_version', p_expected_version
        );
    END IF;

    v_new_version := v_current_version + 1;

    INSERT INTO public.diet_events (
        stream_id,
        version,
        event_type,
        payload,
        metadata,
        clinic_id,
        created_at
    ) VALUES (
        p_stream_id,
        v_new_version,
        p_event_type,
        p_payload,
        p_metadata,
        v_clinic_id,
        now()
    )
    RETURNING id, created_at INTO v_event_id, v_created_at;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'diet_projections') THEN
        INSERT INTO public.diet_projections (
            stream_id,
            current_version,
            diet_name,
            client_id,
            clinic_id,
            snapshot,
            last_event_at
        ) VALUES (
            p_stream_id,
            v_new_version,
            COALESCE(p_payload->>'diet_name', 'Plan Nutricional'),
            COALESCE(p_payload->>'client_id', 'c1'),
            v_clinic_id,
            p_payload,
            v_created_at
        )
        ON CONFLICT (stream_id) DO UPDATE
        SET
            current_version = v_new_version,
            clinic_id = v_clinic_id,
            snapshot = EXCLUDED.snapshot,
            last_event_at = EXCLUDED.last_event_at;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'event_id', v_event_id,
        'stream_id', p_stream_id,
        'version', v_new_version,
        'event_type', p_event_type,
        'clinic_id', v_clinic_id,
        'created_at', v_created_at
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.append_diet_event(TEXT, INT, TEXT, JSONB, JSONB, UUID) TO authenticated, service_role, postgres;

-- 5.3. enqueue_outbox_event
CREATE OR REPLACE FUNCTION public.enqueue_outbox_event(
    p_event_type TEXT,
    p_aggregate_type TEXT,
    p_aggregate_id TEXT,
    p_payload JSONB,
    p_max_attempts INT DEFAULT 5,
    p_clinic_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_event_id UUID;
    v_created_at TIMESTAMPTZ;
    v_clinic_id UUID;
BEGIN
    v_clinic_id := COALESCE(p_clinic_id, (SELECT public.current_user_clinic_id()));

    INSERT INTO public.outbox_events (
        event_type,
        aggregate_type,
        aggregate_id,
        payload,
        status,
        attempts,
        max_attempts,
        clinic_id,
        created_at
    ) VALUES (
        p_event_type,
        p_aggregate_type,
        p_aggregate_id,
        p_payload,
        'pending',
        0,
        COALESCE(p_max_attempts, 5),
        v_clinic_id,
        now()
    )
    RETURNING id, created_at INTO v_event_id, v_created_at;

    RETURN jsonb_build_object(
        'success', true,
        'event_id', v_event_id,
        'event_type', p_event_type,
        'aggregate_type', p_aggregate_type,
        'aggregate_id', p_aggregate_id,
        'clinic_id', v_clinic_id,
        'status', 'pending',
        'created_at', v_created_at
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.enqueue_outbox_event(TEXT, TEXT, TEXT, JSONB, INT, UUID) TO authenticated, service_role, postgres;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. REESCRITURA OPTIMIZADA DE RLS CON InitPlan: (SELECT public.current_user_clinic_id())
-- ─────────────────────────────────────────────────────────────────────────────

-- 6.1. clinics
DROP POLICY IF EXISTS "clinics_tenant_isolation" ON public.clinics;
CREATE POLICY "clinics_tenant_isolation"
    ON public.clinics
    FOR SELECT
    TO authenticated
    USING (id = (SELECT public.current_user_clinic_id()));

-- 6.2. user_profiles
DROP POLICY IF EXISTS "user_profiles_tenant_isolation" ON public.user_profiles;
CREATE POLICY "user_profiles_tenant_isolation"
    ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (clinic_id = (SELECT public.current_user_clinic_id()));

DROP POLICY IF EXISTS "user_profiles_self_write" ON public.user_profiles;
CREATE POLICY "user_profiles_self_write"
    ON public.user_profiles
    FOR ALL
    TO authenticated
    USING (id = auth.uid() AND clinic_id = (SELECT public.current_user_clinic_id()))
    WITH CHECK (id = auth.uid() AND clinic_id = (SELECT public.current_user_clinic_id()));

-- 6.3. clients
DROP POLICY IF EXISTS "clients_tenant_isolation" ON public.clients;
CREATE POLICY "clients_tenant_isolation"
    ON public.clients
    FOR ALL
    TO authenticated
    USING (clinic_id = (SELECT public.current_user_clinic_id()))
    WITH CHECK (clinic_id = (SELECT public.current_user_clinic_id()));

-- 6.4. appointments
DROP POLICY IF EXISTS "appointments_tenant_isolation" ON public.appointments;
CREATE POLICY "appointments_tenant_isolation"
    ON public.appointments
    FOR ALL
    TO authenticated
    USING (clinic_id = (SELECT public.current_user_clinic_id()))
    WITH CHECK (clinic_id = (SELECT public.current_user_clinic_id()));

-- 6.5. diet_events
DROP POLICY IF EXISTS "diet_events_tenant_isolation" ON public.diet_events;
CREATE POLICY "diet_events_tenant_isolation"
    ON public.diet_events
    FOR ALL
    TO authenticated
    USING (clinic_id = (SELECT public.current_user_clinic_id()))
    WITH CHECK (clinic_id = (SELECT public.current_user_clinic_id()));

-- 6.6. outbox_events
DROP POLICY IF EXISTS "outbox_events_tenant_isolation" ON public.outbox_events;
CREATE POLICY "outbox_events_tenant_isolation"
    ON public.outbox_events
    FOR ALL
    TO authenticated
    USING (clinic_id = (SELECT public.current_user_clinic_id()))
    WITH CHECK (clinic_id = (SELECT public.current_user_clinic_id()));

-- 6.7. assigned_diets & items
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assigned_diets') THEN
        DROP POLICY IF EXISTS "assigned_diets_tenant_isolation" ON public.assigned_diets;
        CREATE POLICY "assigned_diets_tenant_isolation"
            ON public.assigned_diets
            FOR ALL
            TO authenticated
            USING (clinic_id = (SELECT public.current_user_clinic_id()))
            WITH CHECK (clinic_id = (SELECT public.current_user_clinic_id()));
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assigned_diet_items') THEN
        DROP POLICY IF EXISTS "assigned_diet_items_tenant_isolation" ON public.assigned_diet_items;
        CREATE POLICY "assigned_diet_items_tenant_isolation"
            ON public.assigned_diet_items
            FOR ALL
            TO authenticated
            USING (clinic_id = (SELECT public.current_user_clinic_id()))
            WITH CHECK (clinic_id = (SELECT public.current_user_clinic_id()));
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'diet_projections') THEN
        DROP POLICY IF EXISTS "diet_projections_tenant_isolation" ON public.diet_projections;
        CREATE POLICY "diet_projections_tenant_isolation"
            ON public.diet_projections
            FOR ALL
            TO authenticated
            USING (clinic_id = (SELECT public.current_user_clinic_id()))
            WITH CHECK (clinic_id = (SELECT public.current_user_clinic_id()));
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_blood_tests') THEN
        DROP POLICY IF EXISTS "blood_tests_tenant_isolation" ON public.client_blood_tests;
        CREATE POLICY "blood_tests_tenant_isolation"
            ON public.client_blood_tests
            FOR ALL
            TO authenticated
            USING (clinic_id = (SELECT public.current_user_clinic_id()))
            WITH CHECK (clinic_id = (SELECT public.current_user_clinic_id()));
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_digestive_logs') THEN
        DROP POLICY IF EXISTS "digestive_logs_tenant_isolation" ON public.client_digestive_logs;
        CREATE POLICY "digestive_logs_tenant_isolation"
            ON public.client_digestive_logs
            FOR ALL
            TO authenticated
            USING (clinic_id = (SELECT public.current_user_clinic_id()))
            WITH CHECK (clinic_id = (SELECT public.current_user_clinic_id()));
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_medications') THEN
        DROP POLICY IF EXISTS "medications_tenant_isolation" ON public.client_medications;
        CREATE POLICY "medications_tenant_isolation"
            ON public.client_medications
            FOR ALL
            TO authenticated
            USING (clinic_id = (SELECT public.current_user_clinic_id()))
            WITH CHECK (clinic_id = (SELECT public.current_user_clinic_id()));
    END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. RESTRICCIÓN NOT NULL ESTRICTA EN clinic_id
-- ─────────────────────────────────────────────────────────────────────────────
-- 7.1. Saneamiento de datos existentes previo a aplicar NOT NULL
UPDATE public.clients SET clinic_id = '11111111-1111-1111-1111-111111111111' WHERE clinic_id IS NULL;
UPDATE public.appointments SET clinic_id = '11111111-1111-1111-1111-111111111111' WHERE clinic_id IS NULL;
UPDATE public.diet_events SET clinic_id = '11111111-1111-1111-1111-111111111111' WHERE clinic_id IS NULL;
UPDATE public.outbox_events SET clinic_id = '11111111-1111-1111-1111-111111111111' WHERE clinic_id IS NULL;

-- 7.2. Imposición de NOT NULL en tablas maestras
ALTER TABLE public.clients ALTER COLUMN clinic_id SET NOT NULL;
ALTER TABLE public.appointments ALTER COLUMN clinic_id SET NOT NULL;
ALTER TABLE public.diet_events ALTER COLUMN clinic_id SET NOT NULL;
ALTER TABLE public.outbox_events ALTER COLUMN clinic_id SET NOT NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assigned_diets') THEN
        UPDATE public.assigned_diets SET clinic_id = '11111111-1111-1111-1111-111111111111' WHERE clinic_id IS NULL;
        ALTER TABLE public.assigned_diets ALTER COLUMN clinic_id SET NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assigned_diet_items') THEN
        UPDATE public.assigned_diet_items SET clinic_id = '11111111-1111-1111-1111-111111111111' WHERE clinic_id IS NULL;
        ALTER TABLE public.assigned_diet_items ALTER COLUMN clinic_id SET NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'diet_projections') THEN
        UPDATE public.diet_projections SET clinic_id = '11111111-1111-1111-1111-111111111111' WHERE clinic_id IS NULL;
        ALTER TABLE public.diet_projections ALTER COLUMN clinic_id SET NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_blood_tests') THEN
        UPDATE public.client_blood_tests SET clinic_id = '11111111-1111-1111-1111-111111111111' WHERE clinic_id IS NULL;
        ALTER TABLE public.client_blood_tests ALTER COLUMN clinic_id SET NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_digestive_logs') THEN
        UPDATE public.client_digestive_logs SET clinic_id = '11111111-1111-1111-1111-111111111111' WHERE clinic_id IS NULL;
        ALTER TABLE public.client_digestive_logs ALTER COLUMN clinic_id SET NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_medications') THEN
        UPDATE public.client_medications SET clinic_id = '11111111-1111-1111-1111-111111111111' WHERE clinic_id IS NULL;
        ALTER TABLE public.client_medications ALTER COLUMN clinic_id SET NOT NULL;
    END IF;
END $$;
