-- ==============================================================================
-- 0014_multi_tenant_rls_verification.sql
-- Batería de Pruebas Automatizadas de Aislamiento RLS Multi-Tenant en PostgreSQL
--
-- Verifica a nivel de motor de base de datos que:
-- 1. Dos clínicas diferentes (Clínica Vida vs Centro Médico Élite) coexisten.
-- 2. El Nutricionista A sólo ve y gestiona pacientes de Clínica Vida.
-- 3. El Nutricionista B jamás ve ni puede acceder a pacientes de Clínica Vida.
-- 4. La base de datos filtra automáticamente mediante RLS SIN requerir WHERE clinic_id.
-- 5. Se bloquean los intentos de cross-tenant injection (escritura cruzada).
-- 6. Los triggers inyectan automáticamente el clinic_id correcto en INSERTs.
-- 7. Los streams de eventos (diet_events) y el Outbox están estrictamente aislados.
-- ==============================================================================

DO $$
DECLARE
    -- Constantes de Clínicas
    c_clinica_vida CONSTANT UUID := '11111111-1111-1111-1111-111111111111';
    c_clinica_elite CONSTANT UUID := '22222222-2222-2222-2222-222222222222';

    -- Constantes de Nutricionistas
    c_nutri_vida CONSTANT UUID := 'aaaa1111-1111-1111-1111-111111111111';
    c_nutri_elite CONSTANT UUID := 'bbbb2222-2222-2222-2222-222222222222';

    -- Variables de control y verificación
    v_count INT;
    v_client_id UUID;
    v_found_name TEXT;
    v_event_result JSONB;
    v_cross_tenant_blocked BOOLEAN := false;
BEGIN
    RAISE NOTICE '========================================================================';
    RAISE NOTICE 'INICIANDO SUITE DE PRUEBAS: AISLAMIENTO RLS MULTI-TENANT EN MOTOR SQL';
    RAISE NOTICE '========================================================================';

    -- ─────────────────────────────────────────────────────────────────────────
    -- PREPARACIÓN: Asegurar que existan las clínicas y perfiles de prueba
    -- ─────────────────────────────────────────────────────────────────────────
    INSERT INTO public.clinics (id, name, slug)
    VALUES 
        (c_clinica_vida, 'Clínica Vida Saludable', 'clinica-vida-test'),
        (c_clinica_elite, 'Centro Médico Élite Nutrición', 'elite-nutricion-test')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;

    -- Perfiles de usuario en user_profiles
    INSERT INTO public.user_profiles (id, clinic_id, role, full_name, email)
    VALUES
        (c_nutri_vida, c_clinica_vida, 'nutritionist', 'Dra. Carmen Gómez Pardo (Vida)', 'carmen@clinicavida.test'),
        (c_nutri_elite, c_clinica_elite, 'nutritionist', 'Dr. Javier Morales (Élite)', 'javier@elitenutricion.test')
    ON CONFLICT (id) DO UPDATE SET clinic_id = EXCLUDED.clinic_id, role = EXCLUDED.role;

    -- Limpieza controlada de pacientes de prueba para aislamiento determinista
    DELETE FROM public.clients WHERE email LIKE '%@multi-tenant-test.local';

    -- Insertar pacientes para Clínica Vida
    INSERT INTO public.clients (id, clinic_id, nutritionist_id, full_name, email, status)
    VALUES
        ('c1000000-0000-0000-0000-000000000001', c_clinica_vida, c_nutri_vida, 'Carlos Pérez (Paciente Vida)', 'carlos.vida@multi-tenant-test.local', 'active'),
        ('c1000000-0000-0000-0000-000000000002', c_clinica_vida, c_nutri_vida, 'Laura García (Paciente Vida)', 'laura.vida@multi-tenant-test.local', 'active');

    -- Insertar pacientes para Clínica Élite
    INSERT INTO public.clients (id, clinic_id, nutritionist_id, full_name, email, status)
    VALUES
        ('c2000000-0000-0000-0000-000000000001', c_clinica_elite, c_nutri_elite, 'Marcos Robles (Paciente Élite)', 'marcos.elite@multi-tenant-test.local', 'active'),
        ('c2000000-0000-0000-0000-000000000002', c_clinica_elite, c_nutri_elite, 'Elena Santos (Paciente Élite)', 'elena.elite@multi-tenant-test.local', 'active');

    -- Inserción de citas de prueba
    DELETE FROM public.appointments WHERE notes LIKE '%[TEST_MULTI_TENANT]%';
    INSERT INTO public.appointments (id, clinic_id, client_id, nutritionist_id, starts_at, ends_at, status, notes)
    VALUES
        ('a1000000-0000-0000-0000-000000000001', c_clinica_vida, 'c1000000-0000-0000-0000-000000000001', c_nutri_vida, now() + interval '1 day', now() + interval '1 day 30 min', 'scheduled', 'Cita Clínica Vida [TEST_MULTI_TENANT]'),
        ('a2000000-0000-0000-0000-000000000001', c_clinica_elite, 'c2000000-0000-0000-0000-000000000001', c_nutri_elite, now() + interval '2 days', now() + interval '2 days 30 min', 'scheduled', 'Cita Clínica Élite [TEST_MULTI_TENANT]');

    RAISE NOTICE '✓ [Setup] Clínicas, perfiles, pacientes y citas de prueba sembrados exitosamente.';

    -- ─────────────────────────────────────────────────────────────────────────
    -- TEST 1: CONTEXTO NUTRICIONISTA CLÍNICA VIDA (SELECT * FROM clients)
    -- ─────────────────────────────────────────────────────────────────────────
    PERFORM public.set_current_clinic(c_clinica_vida);

    -- Comprobación 1.1: Conteo de pacientes visibles
    SELECT count(*) INTO v_count 
    FROM public.clients 
    WHERE email LIKE '%@multi-tenant-test.local';

    IF v_count != 2 THEN
        RAISE EXCEPTION 'TEST 1 FALLIDO: Nutricionista Vida debe ver exactamente 2 pacientes, pero vio %', v_count;
    END IF;

    -- Comprobación 1.2: Ningún paciente de Clínica Élite debe ser visible
    SELECT count(*) INTO v_count 
    FROM public.clients 
    WHERE full_name LIKE '%Paciente Élite%';

    IF v_count != 0 THEN
        RAISE EXCEPTION 'TEST 1 FALLIDO: Brecha de seguridad detectada. Pacientes de Clínica Élite visibles para Clínica Vida (count=%)', v_count;
    END IF;

    RAISE NOTICE '✓ [TEST 1 PASADO]: Nutricionista Clínica Vida ejecuta "SELECT * FROM clients" y PostgreSQL retorna ÚNICAMENTE sus 2 pacientes propios. Filtrado 100%% automático sin cláusula WHERE clinic_id.';

    -- ─────────────────────────────────────────────────────────────────────────
    -- TEST 2: CONTEXTO NUTRICIONISTA CLÍNICA ÉLITE (SELECT * FROM clients)
    -- ─────────────────────────────────────────────────────────────────────────
    PERFORM public.set_current_clinic(c_clinica_elite);

    -- Comprobación 2.1: Conteo de pacientes visibles
    SELECT count(*) INTO v_count 
    FROM public.clients 
    WHERE email LIKE '%@multi-tenant-test.local';

    IF v_count != 2 THEN
        RAISE EXCEPTION 'TEST 2 FALLIDO: Nutricionista Élite debe ver exactamente 2 pacientes, pero vio %', v_count;
    END IF;

    -- Comprobación 2.2: Ningún paciente de Clínica Vida debe ser visible
    SELECT count(*) INTO v_count 
    FROM public.clients 
    WHERE full_name LIKE '%Paciente Vida%';

    IF v_count != 0 THEN
        RAISE EXCEPTION 'TEST 2 FALLIDO: Brecha de seguridad detectada. Pacientes de Clínica Vida visibles para Clínica Élite (count=%)', v_count;
    END IF;

    RAISE NOTICE '✓ [TEST 2 PASADO]: Nutricionista Clínica Élite ejecuta "SELECT * FROM clients" y PostgreSQL retorna ÚNICAMENTE sus pacientes propios. Carlos Pérez y Laura García son 100%% invisibles.';

    -- ─────────────────────────────────────────────────────────────────────────
    -- TEST 3: AUTO-INYECCIÓN DE clinic_id POR TRIGGER EN INSERT
    -- ─────────────────────────────────────────────────────────────────────────
    PERFORM public.set_current_clinic(c_clinica_vida);

    -- Nutricionista de Clínica Vida inserta paciente SIN especificar clinic_id
    INSERT INTO public.clients (nutritionist_id, full_name, email, status)
    VALUES (c_nutri_vida, 'Sofía Valdés (Auto Tenant)', 'sofia.auto@multi-tenant-test.local', 'active')
    RETURNING id, clinic_id INTO v_client_id, v_found_name;

    IF v_found_name::UUID != c_clinica_vida THEN
        RAISE EXCEPTION 'TEST 3 FALLIDO: El trigger no inyectó automáticamente el clinic_id de Clínica Vida. clinic_id obtenido: %', v_found_name;
    END IF;

    RAISE NOTICE '✓ [TEST 3 PASADO]: Inserción sin clinic_id capturada por trigger; PostgreSQL inyectó automáticamente el clinic_id de la clínica activa (%).', c_clinica_vida;

    -- ─────────────────────────────────────────────────────────────────────────
    -- TEST 4: AISLAMIENTO EN CITAS (appointments)
    -- ─────────────────────────────────────────────────────────────────────────
    PERFORM public.set_current_clinic(c_clinica_vida);
    SELECT count(*) INTO v_count FROM public.appointments WHERE notes LIKE '%[TEST_MULTI_TENANT]%';
    IF v_count != 1 THEN
        RAISE EXCEPTION 'TEST 4 FALLIDO: Nutricionista Vida debe ver únicamente 1 cita, pero vio %', v_count;
    END IF;

    PERFORM public.set_current_clinic(c_clinica_elite);
    SELECT count(*) INTO v_count FROM public.appointments WHERE notes LIKE '%[TEST_MULTI_TENANT]%';
    IF v_count != 1 THEN
        RAISE EXCEPTION 'TEST 4 FALLIDO: Nutricionista Élite debe ver únicamente 1 cita, pero vio %', v_count;
    END IF;

    RAISE NOTICE '✓ [TEST 4 PASADO]: Aislamiento estricto de citas y agenda GiST entre clínicas.';

    -- ─────────────────────────────────────────────────────────────────────────
    -- TEST 5: EVENT SOURCING (append_diet_event & anti-hijacking)
    -- ─────────────────────────────────────────────────────────────────────────
    -- Clínica Vida registra evento
    PERFORM public.set_current_clinic(c_clinica_vida);
    v_event_result := public.append_diet_event(
        'stream_diet_carlos_vida_test',
        0,
        'DietAssigned',
        '{"diet_name": "Plan Vida Test", "kcal": 2100}'::jsonb,
        '{"author": "Dra. Carmen"}'::jsonb
    );

    IF (v_event_result->>'success')::BOOLEAN != true THEN
        RAISE EXCEPTION 'TEST 5 FALLIDO: No se pudo registrar el evento para Clínica Vida: %', v_event_result;
    END IF;

    IF (v_event_result->>'clinic_id')::UUID != c_clinica_vida THEN
        RAISE EXCEPTION 'TEST 5 FALLIDO: El evento no quedó vinculado al clinic_id de Clínica Vida';
    END IF;

    -- Clínica Élite intenta leer el stream de Clínica Vida
    PERFORM public.set_current_clinic(c_clinica_elite);
    SELECT count(*) INTO v_count FROM public.get_diet_event_stream('stream_diet_carlos_vida_test');
    IF v_count != 0 THEN
        RAISE EXCEPTION 'TEST 5 FALLIDO: Clínica Élite pudo leer el stream dietético de Clínica Vida (filas=%)', v_count;
    END IF;

    -- Clínica Élite intenta secuestrar / añadir un evento al stream de Clínica Vida
    v_event_result := public.append_diet_event(
        'stream_diet_carlos_vida_test',
        1,
        'FoodSwapped',
        '{"food": "Intento no autorizado"}'::jsonb
    );

    IF (v_event_result->>'success')::BOOLEAN = true THEN
        RAISE EXCEPTION 'TEST 5 FALLIDO: Clínica Élite pudo añadir un evento al stream de Clínica Vida. El bloqueo de cross-tenant falló!';
    END IF;

    RAISE NOTICE '✓ [TEST 5 PASADO]: Event Sourcing inmutable protegido contra Cross-Tenant Hijacking: los eventos se sellan con el clinic_id activo y otra clínica recibe 0 filas y rechazo transaccional.';

    -- ─────────────────────────────────────────────────────────────────────────
    -- TEST 6: TRANSACTIONAL OUTBOX (enqueue_outbox_event)
    -- ─────────────────────────────────────────────────────────────────────────
    PERFORM public.set_current_clinic(c_clinica_vida);
    v_event_result := public.enqueue_outbox_event(
        'client.welcome_email',
        'client',
        'c1000000-0000-0000-0000-000000000001',
        '{"email": "carlos.vida@multi-tenant-test.local"}'::jsonb
    );

    IF (v_event_result->>'clinic_id')::UUID != c_clinica_vida THEN
        RAISE EXCEPTION 'TEST 6 FALLIDO: Outbox event no inyectó el clinic_id de Clínica Vida';
    END IF;

    -- Clínica Élite no debe ver el evento de Outbox de Clínica Vida
    PERFORM public.set_current_clinic(c_clinica_elite);
    SELECT count(*) INTO v_count 
    FROM public.outbox_events 
    WHERE aggregate_id = 'c1000000-0000-0000-0000-000000000001';

    IF v_count != 0 THEN
        RAISE EXCEPTION 'TEST 6 FALLIDO: Clínica Élite pudo ver el evento outbox de Clínica Vida (count=%)', v_count;
    END IF;

    RAISE NOTICE '✓ [TEST 6 PASADO]: Transactional Outbox aislado al 100%% por clinic_id.';

    RAISE NOTICE '========================================================================';
    RAISE NOTICE 'TODOS LOS TESTS DE AISLAMIENTO MULTI-TENANT SQL HAN SIDO SUPERADOS (100%%)';
    RAISE NOTICE 'El motor PostgreSQL garantiza el aislamiento sin intervención de Node.js.';
    RAISE NOTICE '========================================================================';
END $$;
