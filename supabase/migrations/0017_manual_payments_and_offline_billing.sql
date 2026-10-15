-- ==============================================================================
-- 0017 · Pagos Manuales (Bizum / Efectivo / Transferencia) y Facturación Offline
-- Permite desacoplar el estado de pago de Stripe para pacientes presenciales
-- eliminando comisiones de pasarela (0% comisión) y asegurando trazabilidad
-- ==============================================================================

-- 1. Ampliar tabla 'clients' con columnas para método de pago y renovación
alter table public.clients
  add column if not exists payment_method text check (payment_method in ('stripe', 'bizum', 'cash', 'transfer')) default 'stripe',
  add column if not exists renewal_date timestamptz,
  add column if not exists last_payment_amount_eur numeric default 79.00;

create index if not exists idx_clients_payment_method on public.clients(payment_method);
create index if not exists idx_clients_renewal_date on public.clients(renewal_date);

-- 2. Tabla de Registro Histórico de Pagos y Justificantes (Online y Offline)
create table if not exists public.manual_payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  nutritionist_id uuid references public.nutritionists(id) on delete set null,
  payment_method text not null check (payment_method in ('cash', 'bizum', 'transfer', 'stripe')),
  amount_eur numeric not null default 79.00,
  period_days int not null default 30,
  status text not null default 'completed' check (status in ('completed', 'refunded', 'pending')),
  concept text default 'Renovación Pauta Nutricional y Seguimiento Clínico',
  notes text,
  registered_at timestamptz default now()
);

create index if not exists idx_manual_payments_client on public.manual_payments(client_id);
create index if not exists idx_manual_payments_date on public.manual_payments(registered_at desc);

-- 3. Habilitar RLS en 'manual_payments'
alter table public.manual_payments enable row level security;

-- Política lectura: nutricionistas autenticados y service_role
create policy "nutritionists_read_manual_payments"
  on public.manual_payments
  for select
  to authenticated, service_role
  using (true);

-- Política inserción: nutricionistas autenticados y service_role
create policy "nutritionists_insert_manual_payments"
  on public.manual_payments
  for insert
  to authenticated, service_role
  with check (true);

-- 4. Función RPC atómica para registrar cobro manual y reactivar al paciente
create or replace function public.register_manual_payment(
  p_client_id uuid,
  p_payment_method text,
  p_amount_eur numeric default 79.00,
  p_period_days int default 30,
  p_notes text default null,
  p_nutritionist_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_name text;
  v_renewal_date timestamptz;
  v_payment_id uuid;
begin
  -- 1. Validar método de pago permitido
  if p_payment_method not in ('cash', 'bizum', 'transfer', 'stripe') then
    return jsonb_build_object(
      'success', false,
      'error', 'Método de pago inválido. Permitidos: cash, bizum, transfer, stripe'
    );
  end if;

  -- 2. Calcular fecha de renovación clínica
  v_renewal_date := now() + (p_period_days || ' days')::interval;

  -- 3. Registrar el pago en el libro de transacciones
  insert into public.manual_payments (
    client_id,
    nutritionist_id,
    payment_method,
    amount_eur,
    period_days,
    status,
    notes,
    registered_at
  ) values (
    p_client_id,
    p_nutritionist_id,
    p_payment_method,
    p_amount_eur,
    p_period_days,
    'completed',
    p_notes,
    now()
  )
  returning id into v_payment_id;

  -- 4. Actualizar ficha del cliente a 'active' con nueva fecha de renovación
  update public.clients
  set
    status = 'active',
    payment_method = p_payment_method,
    last_payment_at = now(),
    renewal_date = v_renewal_date,
    last_payment_amount_eur = p_amount_eur
  where id = p_client_id
  returning full_name into v_client_name;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Paciente no encontrado con el id especificado'
    );
  end if;

  -- 5. Sincronizar estado en tabla de suscripciones si existe
  update public.subscriptions
  set
    status = 'active',
    end_date = v_renewal_date
  where client_id = p_client_id;

  -- 6. Encolar evento en Outbox (notificación n8n / recibo digital sin coste)
  begin
    insert into public.outbox_events (
      event_type,
      aggregate_type,
      aggregate_id,
      payload
    ) values (
      'billing.payment_received',
      'client',
      p_client_id::text,
      jsonb_build_object(
        'payment_id', v_payment_id,
        'client_id', p_client_id,
        'client_name', v_client_name,
        'payment_method', p_payment_method,
        'amount_eur', p_amount_eur,
        'renewal_date', v_renewal_date,
        'period_days', p_period_days,
        'notes', p_notes,
        'timestamp', now()
      )
    );
  exception when others then
    -- No bloquear la transacción si la tabla outbox no está presente o falla
    null;
  end;

  return jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'client_id', p_client_id,
    'client_name', v_client_name,
    'status', 'active',
    'payment_method', p_payment_method,
    'amount_eur', p_amount_eur,
    'renewal_date', v_renewal_date,
    'timestamp', now()
  );
end;
$$;

-- Permisos de ejecución de la RPC
grant execute on function public.register_manual_payment(uuid, text, numeric, int, text, uuid) to anon, authenticated, service_role;
