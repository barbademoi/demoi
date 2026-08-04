-- Licença avulsa da Brindoleta por barbearia.
-- Pagamento é conferido manualmente pelo administrador antes da liberação.

create table if not exists public.brindoleta_licenses (
  barbearia_id uuid primary key references public.barbearias(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'rejected', 'suspended')),
  amount_cents integer not null default 4700 check (amount_cents > 0),
  payer_name text,
  payment_note text,
  requested_by uuid references auth.users(id) on delete set null,
  requested_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists brindoleta_licenses_status_idx
  on public.brindoleta_licenses(status, requested_at desc);

alter table public.brindoleta_licenses enable row level security;

drop policy if exists "dono_le_licenca_brindoleta" on public.brindoleta_licenses;
create policy "dono_le_licenca_brindoleta"
  on public.brindoleta_licenses
  for select
  to authenticated
  using (barbearia_id = public.get_barbearia_id());

-- Solicitações e aprovações passam por Server Actions que revalidam a sessão.
-- O cliente autenticado só pode ler a própria situação; service_role escreve.
revoke insert, update, delete on public.brindoleta_licenses from authenticated;
grant select on public.brindoleta_licenses to authenticated;

create or replace function public.has_brindoleta()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.brindoleta_licenses l
    where l.barbearia_id = public.get_barbearia_id()
      and l.status = 'active'
  );
$$;

grant execute on function public.has_brindoleta() to authenticated;

comment on table public.brindoleta_licenses is
  'Licença única da Brindoleta por barbearia. Acesso só fica ativo após conferência manual do Pix.';
