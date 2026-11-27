-- =====================================================================
-- TAREFIX — 017 · Vendas avulsas (página de vendas / Instagram)
-- A pessoa preenche os dados, faz o Pix e avisa. O admin confere e libera:
-- aí nasce a conta (senha provisória) com o Tarefix dela.
-- Só a service role lê/grava.
-- =====================================================================

create table if not exists tarefix.vendas (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  email         text not null,
  whatsapp      text not null,
  empresa       text not null,
  payer_name    text,
  status        text not null default 'pendente' check (status in ('pendente', 'liberada', 'recusada')),
  motivo        text,
  user_id       uuid,
  valor_centavos integer not null default 4700,
  criado_em     timestamptz not null default now(),
  revisado_em   timestamptz
);
create index if not exists vendas_status_idx on tarefix.vendas(status, criado_em desc);
create index if not exists vendas_email_idx on tarefix.vendas(lower(email));
alter table tarefix.vendas enable row level security;
revoke all on tarefix.vendas from anon, authenticated;
grant all on tarefix.vendas to service_role;
