-- ==============================================================================
-- 0014 · Arquitectura Multi-Tenant y Aislamiento RLS Imparable por Clínica
-- Aislamiento total a nivel de motor PostgreSQL (Row Level Security)
-- ==============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. TABLA MAESTRA DE CLÍNICAS / TENANTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    cif_nif TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    logo_url TEXT,
    settings JSONB NOT NULL DEFAULT '{"currency": "EUR", "timezone": "Europe/Madrid"}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_clinics_slug ON public.clinics(slug);
CREATE INDEX IF NOT EXISTS idx_clinics_is_active ON public.clinics(is_active);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TABLA DE PERFILES ASOCIADA A CLINIC_ID (user_profiles)
-- Vincula el auth.uid() de Supabase con el clinic_id del tenant respectivo
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'nutritionist' CHECK (role IN ('superadmin', 'clinic_admin', 'nutritionist', 'staff', 'patient')),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_clinic_id ON public.user_profiles(clinic_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Compatibilidad bidireccional con profiles existente
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_profiles_clinic_id ON public.profiles(clinic_id);
    END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. FUNCIÓN DE CONTEXTO: current_user_clinic_id()
-- Resuelve el clinic_id del usuario autenticado en el motor PostgreSQL
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
    -- 1. Verificación de variable de sesión / transacción (útil en tests, workers y microservicios)
    BEGIN
        v_clinic_id := NULLIF(current_setting('app.current_clinic_id', true), '')::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_clinic_id := NULL;
    END;

    IF v_clinic_id IS NOT NULL THEN
        RETURN v_clinic_id;
    END IF;

    -- 2. Verificación de claims del token JWT de Supabase (app_metadata -> clinic_id)
    BEGIN
        v_clinic_id := NULLIF((current_setting('request.jwt.claims', true)::JSONB -> 'app_metadata' ->> 'clinic_id'), '')::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_clinic_id := NULL;
    END;

    IF v_clinic_id IS NOT NULL THEN
        RETURN v_clinic_id;
    END IF;

    -- 3. Búsqueda en la tabla de perfiles user_profiles para el auth.uid()
    v_uid := auth.uid();
    IF v_uid IS NOT NULL THEN
        SELECT up.clinic_id INTO v_clinic_id
        FROM public.user_profiles up
        WHERE up.id = v_uid AND up.is_active = true
        LIMIT 1;

        IF v_clinic_id IS NOT NULL THEN
            RETURN v_clinic_id;
        END IF;

        -- Fallback a profiles legacy si existe
        BEGIN
            SELECT p.clinic_id INTO v_clinic_id
            FROM public.profiles p
            WHERE p.id = v_uid
            LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            v_clinic_id := NULL;
        END;
    END IF;

    RETURN v_clinic_id;
END;
$$;

-- Función utilitaria para fijar clinic_id en sesiones de transacción
CREATE OR REPLACE FUNCTION public.set_current_clinic(p_clinic_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM set_config('app.current_clinic_id', p_clinic_id::TEXT, false);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. MODIFICACIÓN DEL ESQUEMA (DDL): COLUMNA clinic_id EN TABLAS MAESTRAS
-- ─────────────────────────────────────────────────────────────────────────────

-- 4.1. clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE;
ALTER TABLE public.clients ALTER COLUMN clinic_id SET DEFAULT public.current_user_clinic_id();
CREATE INDEX IF NOT EXISTS idx_clients_clinic_id ON public.clients(clinic_id);

-- 4.2. appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE;
ALTER TABLE public.appointments ALTER COLUMN clinic_id SET DEFAULT public.current_user_clinic_id();
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON public.appointments(clinic_id);

-- 4.3. diet_events
ALTER TABLE public.diet_events ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE;
ALTER TABLE public.diet_events ALTER COLUMN clinic_id SET DEFAULT public.current_user_clinic_id();
CREATE INDEX IF NOT EXISTS idx_diet_events_clinic_id ON public.diet_events(clinic_id);

-- 4.4. outbox_events
ALTER TABLE public.outbox_events ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE;
ALTER TABLE public.outbox_events ALTER COLUMN clinic_id SET DEFAULT public.current_user_clinic_id();
CREATE INDEX IF NOT EXISTS idx_outbox_events_clinic_id ON public.outbox_events(clinic_id);

-- 4.5. assigned_diets y assigned_diet_items
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assigned_diets') THEN
        ALTER TABLE public.assigned_diets ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE;
        ALTER TABLE public.assigned_diets ALTER COLUMN clinic_id SET DEFAULT public.current_user_clinic_id();
        CREATE INDEX IF NOT EXISTS idx_assigned_diets_clinic_id ON public.assigned_diets(clinic_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assigned_diet_items') THEN
        ALTER TABLE public.assigned_diet_items ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE;
        ALTER TABLE public.assigned_diet_items ALTER COLUMN clinic_id SET DEFAULT public.current_user_clinic_id();
        CREATE INDEX IF NOT EXISTS idx_assigned_diet_items_clinic_id ON public.assigned_diet_items(clinic_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'diet_templates') THEN
        ALTER TABLE public.diet_templates ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE;
        ALTER TABLE public.diet_templates ALTER COLUMN clinic_id SET DEFAULT public.current_user_clinic_id();
        CREATE INDEX IF NOT EXISTS idx_diet_templates_clinic_id ON public.diet_templates(clinic_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'diet_projections') THEN
        ALTER TABLE public.diet_projections ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE;
        ALTER TABLE public.diet_projections ALTER COLUMN clinic_id SET DEFAULT public.current_user_clinic_id();
        CREATE INDEX IF NOT EXISTS idx_diet_projections_clinic_id ON public.diet_projections(clinic_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'plans') THEN
        ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_plans_clinic_id ON public.plans(clinic_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
        ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_subscriptions_clinic_id ON public.subscriptions(clinic_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_blood_tests') THEN
        ALTER TABLE public.client_blood_tests ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE;
        ALTER TABLE public.client_blood_tests ALTER COLUMN clinic_id SET DEFAULT public.current_user_clinic_id();
        CREATE INDEX IF NOT EXISTS idx_client_blood_tests_clinic_id ON public.client_blood_tests(clinic_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_digestive_logs') THEN
        ALTER TABLE public.client_digestive_logs ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE;
        ALTER TABLE public.client_digestive_logs ALTER COLUMN clinic_id SET DEFAULT public.current_user_clinic_id();
        CREATE INDEX IF NOT EXISTS idx_client_digestive_logs_clinic_id ON public.client_digestive_logs(clinic_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_medications') THEN
        ALTER TABLE public.client_medications ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE;
        ALTER TABLE public.client_medications ALTER COLUMN clinic_id SET DEFAULT public.current_user_clinic_id();
        CREATE INDEX IF NOT EXISTS idx_client_medications_clinic_id ON public.client_medications(clinic_id);
    END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. TRIGGER DE AUTO-INYECCIÓN DE clinic_id (SEGURIDAD TRANSACCIONAL)
-- Garantiza que si el backend Node.js no provee clinic_id, la base de datos lo inyecta
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.inject_tenant_clinic_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.clinic_id IS NULL THEN
        NEW.clinic_id := public.current_user_clinic_id();
    END IF;

    IF NEW.clinic_id IS NULL THEN
        RAISE EXCEPTION 'Aislamiento Multi-Tenant Fallido: No se puede insertar en % sin un clinic_id válido en el contexto actual.', TG_TABLE_NAME;
    END IF;

    RETURN NEW;
END;
$$;

-- Triggers de inserción para tablas maestras
DROP TRIGGER IF EXISTS trg_inject_clinic_id_clients ON public.clients;
CREATE TRIGGER trg_inject_clinic_id_clients
    BEFORE INSERT ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.inject_tenant_clinic_id();

DROP TRIGGER IF EXISTS trg_inject_clinic_id_appointments ON public.appointments;
CREATE TRIGGER trg_inject_clinic_id_appointments
    BEFORE INSERT ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.inject_tenant_clinic_id();

DROP TRIGGER IF EXISTS trg_inject_clinic_id_diet_events ON public.diet_events;
CREATE TRIGGER trg_inject_clinic_id_diet_events
    BEFORE INSERT ON public.diet_events
    FOR EACH ROW
    EXECUTE FUNCTION public.inject_tenant_clinic_id();

DROP TRIGGER IF EXISTS trg_inject_clinic_id_outbox_events ON public.outbox_events;
CREATE TRIGGER trg_inject_clinic_id_outbox_events
    BEFORE INSERT ON public.outbox_events
    FOR EACH ROW
    EXECUTE FUNCTION public.inject_tenant_clinic_id();

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assigned_diets') THEN
        DROP TRIGGER IF EXISTS trg_inject_clinic_id_assigned_diets ON public.assigned_diets;
        CREATE TRIGGER trg_inject_clinic_id_assigned_diets
            BEFORE INSERT ON public.assigned_diets
            FOR EACH ROW
            EXECUTE FUNCTION public.inject_tenant_clinic_id();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assigned_diet_items') THEN
        DROP TRIGGER IF EXISTS trg_inject_clinic_id_assigned_diet_items ON public.assigned_diet_items;
        CREATE TRIGGER trg_inject_clinic_id_assigned_diet_items
            BEFORE INSERT ON public.assigned_diet_items
            FOR EACH ROW
            EXECUTE FUNCTION public.inject_tenant_clinic_id();
    END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. REFACTORIZACIÓN Y BLINDAJE DE ROW LEVEL SECURITY (RLS) MULTI-TENANT
-- Comprueba clinic_id = current_user_clinic_id() a nivel de motor PostgreSQL
-- ─────────────────────────────────────────────────────────────────────────────

-- 6.1. Habilitar RLS en tablas multi-tenant
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbox_events ENABLE ROW LEVEL SECURITY;

-- 6.2. POLÍTICAS RLS PARA clinics
DROP POLICY IF EXISTS "clinics_tenant_isolation" ON public.clinics;
CREATE POLICY "clinics_tenant_isolation"
    ON public.clinics
    FOR SELECT
    TO authenticated
    USING (id = public.current_user_clinic_id());

-- 6.3. POLÍTICAS RLS PARA user_profiles
DROP POLICY IF EXISTS "user_profiles_tenant_isolation" ON public.user_profiles;
CREATE POLICY "user_profiles_tenant_isolation"
    ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (clinic_id = public.current_user_clinic_id());

DROP POLICY IF EXISTS "user_profiles_self_write" ON public.user_profiles;
CREATE POLICY "user_profiles_self_write"
    ON public.user_profiles
    FOR ALL
    TO authenticated
    USING (id = auth.uid() AND clinic_id = public.current_user_clinic_id())
    WITH CHECK (id = auth.uid() AND clinic_id = public.current_user_clinic_id());

-- 6.4. POLÍTICAS RLS PARA clients
-- Eliminación de políticas legacy de Fase 1
DROP POLICY IF EXISTS "clients_nutritionist_access" ON public.clients;
DROP POLICY IF EXISTS "allow_read_clients" ON public.clients;
DROP POLICY IF EXISTS "clients_tenant_isolation" ON public.clients;
DROP POLICY IF EXISTS "clients_patient_own_read" ON public.clients;

-- Aislamiento de clínica: El profesional solo lee/escribe pacientes de su propia clínica
CREATE POLICY "clients_tenant_isolation"
    ON public.clients
    FOR ALL
    TO authenticated
    USING (clinic_id = public.current_user_clinic_id())
    WITH CHECK (clinic_id = public.current_user_clinic_id());

-- Lectura de paciente propio (si accede con su propio perfil)
CREATE POLICY "clients_patient_own_read"
    ON public.clients
    FOR SELECT
    TO authenticated
    USING (profile_id = auth.uid() OR id = auth.uid());

-- 6.5. POLÍTICAS RLS PARA appointments
DROP POLICY IF EXISTS "appointments_nutritionist_access" ON public.appointments;
DROP POLICY IF EXISTS "allow_public_booking_select" ON public.appointments;
DROP POLICY IF EXISTS "allow_public_booking_insert" ON public.appointments;
DROP POLICY IF EXISTS "appointments_tenant_isolation" ON public.appointments;

CREATE POLICY "appointments_tenant_isolation"
    ON public.appointments
    FOR ALL
    TO authenticated
    USING (clinic_id = public.current_user_clinic_id())
    WITH CHECK (clinic_id = public.current_user_clinic_id());

-- 6.6. POLÍTICAS RLS PARA diet_events
DROP POLICY IF EXISTS "allow_diet_events_access" ON public.diet_events;
DROP POLICY IF EXISTS "diet_events_tenant_isolation" ON public.diet_events;

CREATE POLICY "diet_events_tenant_isolation"
    ON public.diet_events
    FOR ALL
    TO authenticated
    USING (clinic_id = public.current_user_clinic_id())
    WITH CHECK (clinic_id = public.current_user_clinic_id());

-- 6.7. POLÍTICAS RLS PARA outbox_events
DROP POLICY IF EXISTS "outbox_service_access" ON public.outbox_events;
DROP POLICY IF EXISTS "outbox_events_tenant_isolation" ON public.outbox_events;

CREATE POLICY "outbox_events_tenant_isolation"
    ON public.outbox_events
    FOR ALL
    TO authenticated
    USING (clinic_id = public.current_user_clinic_id())
    WITH CHECK (clinic_id = public.current_user_clinic_id());

-- 6.8. POLÍTICAS RLS PARA assigned_diets y assigned_diet_items
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assigned_diets') THEN
        ALTER TABLE public.assigned_diets ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "nutritionist_manage_assigned_diets" ON public.assigned_diets;
        DROP POLICY IF EXISTS "allow_crud_assigned_diets" ON public.assigned_diets;
        DROP POLICY IF EXISTS "assigned_diets_tenant_isolation" ON public.assigned_diets;

        CREATE POLICY "assigned_diets_tenant_isolation"
            ON public.assigned_diets
            FOR ALL
            TO authenticated
            USING (clinic_id = public.current_user_clinic_id())
            WITH CHECK (clinic_id = public.current_user_clinic_id());
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assigned_diet_items') THEN
        ALTER TABLE public.assigned_diet_items ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "nutritionist_manage_assigned_diet_items" ON public.assigned_diet_items;
        DROP POLICY IF EXISTS "allow_crud_assigned_diet_items" ON public.assigned_diet_items;
        DROP POLICY IF EXISTS "assigned_diet_items_tenant_isolation" ON public.assigned_diet_items;

        CREATE POLICY "assigned_diet_items_tenant_isolation"
            ON public.assigned_diet_items
            FOR ALL
            TO authenticated
            USING (clinic_id = public.current_user_clinic_id())
            WITH CHECK (clinic_id = public.current_user_clinic_id());
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'diet_projections') THEN
        ALTER TABLE public.diet_projections ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "allow_diet_projections_access" ON public.diet_projections;
        DROP POLICY IF EXISTS "diet_projections_tenant_isolation" ON public.diet_projections;

        CREATE POLICY "diet_projections_tenant_isolation"
            ON public.diet_projections
            FOR ALL
            TO authenticated
            USING (clinic_id = public.current_user_clinic_id())
            WITH CHECK (clinic_id = public.current_user_clinic_id());
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_blood_tests') THEN
        ALTER TABLE public.client_blood_tests ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "blood_tests_tenant_isolation" ON public.client_blood_tests;
        CREATE POLICY "blood_tests_tenant_isolation"
            ON public.client_blood_tests
            FOR ALL
            TO authenticated
            USING (clinic_id = public.current_user_clinic_id())
            WITH CHECK (clinic_id = public.current_user_clinic_id());
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_digestive_logs') THEN
        ALTER TABLE public.client_digestive_logs ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "digestive_logs_tenant_isolation" ON public.client_digestive_logs;
        CREATE POLICY "digestive_logs_tenant_isolation"
            ON public.client_digestive_logs
            FOR ALL
            TO authenticated
            USING (clinic_id = public.current_user_clinic_id())
            WITH CHECK (clinic_id = public.current_user_clinic_id());
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_medications') THEN
        ALTER TABLE public.client_medications ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "medications_tenant_isolation" ON public.client_medications;
        CREATE POLICY "medications_tenant_isolation"
            ON public.client_medications
            FOR ALL
            TO authenticated
            USING (clinic_id = public.current_user_clinic_id())
            WITH CHECK (clinic_id = public.current_user_clinic_id());
    END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. REFACTORIZACIÓN DE FUNCIONES Y RPCS CON SEGURIDAD MULTI-TENANT
-- Auto-inyección de clinic_id y prevención de cruce entre tenants
-- ─────────────────────────────────────────────────────────────────────────────

-- 7.1. append_diet_event: Append-Only con blindaje multi-tenant
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
    -- 1. Resolver clinic_id automáticamente del contexto si no se especifica
    v_clinic_id := COALESCE(p_clinic_id, public.current_user_clinic_id());

    -- 2. Detección y prevención de secuestro de stream entre clínicas (Cross-Tenant Hijacking)
    SELECT clinic_id INTO v_existing_clinic_id
    FROM public.diet_events
    WHERE stream_id = p_stream_id
    LIMIT 1;

    IF v_existing_clinic_id IS NOT NULL THEN
        IF v_clinic_id IS NOT NULL AND v_existing_clinic_id != v_clinic_id THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'CrossTenantViolation: El stream clínico ' || p_stream_id || ' pertenece a otra clínica. Operación abortada.'
            );
        END IF;
        v_clinic_id := v_existing_clinic_id;
    END IF;

    IF v_clinic_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'TenantError: No se ha podido resolver el clinic_id para el evento en el contexto de seguridad actual.'
        );
    END IF;

    -- 3. Versión actual del stream
    SELECT COALESCE(MAX(version), 0) INTO v_current_version
    FROM public.diet_events
    WHERE stream_id = p_stream_id;

    -- 4. OCC (Optimistic Concurrency Control)
    IF p_expected_version IS NOT NULL AND p_expected_version >= 0 AND v_current_version != p_expected_version THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'ConcurrencyConflict: Versión esperada (' || p_expected_version || ') distinta a versión actual (' || v_current_version || ').',
            'current_version', v_current_version,
            'expected_version', p_expected_version
        );
    END IF;

    v_new_version := v_current_version + 1;

    -- 5. Inserción atómica con clinic_id garantizado
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

    -- 6. Actualización de proyección desnormalizada para lectura rápida
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

-- 7.2. get_diet_event_stream con filtrado estricto por tenant
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
      AND (e.clinic_id IS NULL OR e.clinic_id = public.current_user_clinic_id())
      AND (p_target_version IS NULL OR e.version <= p_target_version)
    ORDER BY e.version ASC;
$$;

-- 7.3. enqueue_outbox_event con inyección automática de clinic_id
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
    v_clinic_id := COALESCE(p_clinic_id, public.current_user_clinic_id());

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

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. DATOS SEMILLA PARA VALIDACIÓN Y PRUEBAS DE AISLAMIENTO MULTI-TENANT
-- ─────────────────────────────────────────────────────────────────────────────

-- 8.1. Sembrado de Clínicas
INSERT INTO public.clinics (id, name, slug, cif_nif, email, phone, address)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Clínica Vida Saludable', 'clinica-vida', 'B-12345678', 'contacto@clinicavida.com', '+34 911 223 344', 'Calle Gran Vía 42, Madrid'),
    ('22222222-2222-2222-2222-222222222222', 'Centro Médico Élite Nutrición', 'elite-nutricion', 'B-87654321', 'info@elitenutricion.com', '+34 933 445 566', 'Passeig de Gràcia 15, Barcelona')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    updated_at = now();

-- 8.2. Actualizar registros huérfanos anteriores al tenant por defecto si existieran
UPDATE public.clients SET clinic_id = '11111111-1111-1111-1111-111111111111' WHERE clinic_id IS NULL;
UPDATE public.appointments SET clinic_id = '11111111-1111-1111-1111-111111111111' WHERE clinic_id IS NULL;
UPDATE public.diet_events SET clinic_id = '11111111-1111-1111-1111-111111111111' WHERE clinic_id IS NULL;
UPDATE public.outbox_events SET clinic_id = '11111111-1111-1111-1111-111111111111' WHERE clinic_id IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. PERMISOS EXPLÍCITOS (DATA API SUPABASE)
-- ─────────────────────────────────────────────────────────────────────────────
GRANT SELECT ON public.clinics TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT SELECT, INSERT ON public.diet_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.outbox_events TO authenticated;

GRANT EXECUTE ON FUNCTION public.current_user_clinic_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.set_current_clinic(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.append_diet_event(TEXT, INT, TEXT, JSONB, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_diet_event_stream(TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_outbox_event(TEXT, TEXT, TEXT, JSONB, INT, UUID) TO authenticated;
