-- Tarefix como módulo extra do BarberMeta (pagamento único, Pix conferido à mão).
-- Mesmo modelo da Brindoleta: o dono pede, o admin confere o Pix e libera.
-- Ao liberar, a conta do dono ganha um Tarefix (schema tarefix) com o nome da
-- barbearia informado no pedido.

create table if not exists public.tarefix_licencas (
  barbearia_id uuid primary key references public.barbearias(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'rejected', 'suspended')),
  amount_cents integer not null default 4700 check (amount_cents > 0),
  nome_barbearia text,
  whatsapp text,
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

create index if not exists tarefix_licencas_status_idx
  on public.tarefix_licencas(status, requested_at desc);

alter table public.tarefix_licencas enable row level security;

drop policy if exists "dono_le_licenca_tarefix" on public.tarefix_licencas;
create policy "dono_le_licenca_tarefix"
  on public.tarefix_licencas
  for select
  to authenticated
  using (barbearia_id = public.get_barbearia_id());

-- Pedido e aprovação passam por Server Actions (service_role).
revoke insert, update, delete on public.tarefix_licencas from authenticated;
grant select on public.tarefix_licencas to authenticated;

comment on table public.tarefix_licencas is
  'Licença única do Tarefix por barbearia. Acesso só fica ativo após conferência manual do Pix.';
