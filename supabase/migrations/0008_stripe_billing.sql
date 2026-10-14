-- ==============================================================================
-- 0008 · Pasarela de Pagos, Suscripciones y Webhooks Seguros (Stripe)
-- Migración para el ciclo de vida del cliente y automatización de estados
-- ==============================================================================

-- 1. Ampliar tabla 'clients' con metadatos de facturación Stripe
alter table public.clients
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists last_payment_at timestamptz;

create index if not exists idx_clients_stripe_customer on public.clients(stripe_customer_id);
create index if not exists idx_clients_stripe_subscription on public.clients(stripe_subscription_id);

-- 2. Ampliar tabla 'subscriptions' con referencias de Stripe
alter table public.subscriptions
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_price_id text;

-- 3. Función RPC segura con SECURITY DEFINER para actualización de estado de facturación
-- Permite que el webhook de Stripe ejecute el cambio de estado atómicamente
-- y sin colisionar con las restricciones RLS de usuarios no autenticados.
create or replace function public.update_client_billing_status(
  p_client_id uuid,
  p_status text,
  p_stripe_customer_id text default null,
  p_stripe_subscription_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated_rows int;
  v_client_name text;
begin
  -- Validar estado permitido
  if p_status not in ('active', 'inactive', 'pending_review') then
    return jsonb_build_object(
      'success', false,
      'error', 'Estado inválido. Debe ser: active, inactive o pending_review'
    );
  end if;

  -- Actualizar registro en 'clients'
  update public.clients
  set
    status = p_status,
    stripe_customer_id = coalesce(p_stripe_customer_id, stripe_customer_id),
    stripe_subscription_id = coalesce(p_stripe_subscription_id, stripe_subscription_id),
    last_payment_at = case when p_status = 'active' then now() else last_payment_at end,
    consent_at = coalesce(consent_at, now())
  where id = p_client_id
  returning full_name into v_client_name;

  get diagnostics v_updated_rows = row_count;

  -- Si es una suscripción activa/cancelada, sincronizar también la tabla 'subscriptions'
  if p_stripe_subscription_id is not null then
    update public.subscriptions
    set
      status = case 
        when p_status = 'active' then 'active'
        when p_status = 'inactive' then 'cancelled'
        else status
      end,
      stripe_subscription_id = p_stripe_subscription_id,
      stripe_customer_id = coalesce(p_stripe_customer_id, stripe_customer_id)
    where client_id = p_client_id;
  end if;

  return jsonb_build_object(
    'success', v_updated_rows > 0,
    'client_id', p_client_id,
    'client_name', v_client_name,
    'status', p_status,
    'stripe_customer_id', p_stripe_customer_id,
    'stripe_subscription_id', p_stripe_subscription_id,
    'timestamp', now()
  );
end;
$$;

-- Otorgar ejecución segura a roles de servicio y API
grant execute on function public.update_client_billing_status(uuid, text, text, text) to anon, authenticated, service_role;
