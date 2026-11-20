-- =====================================================================
-- TAREFIX — 015 · Engajamento dos mentorados
-- Cada vez que o mentorado abre (ou volta para) o link da mentoria, grava um
-- acesso — e se estava aberto pelo ícone da tela de início (app instalado).
-- Só a service role lê/grava (o admin vê pelo painel).
-- =====================================================================

create table if not exists tarefix.mentoria_acessos (
  id           bigint generated always as identity primary key,
  mentorado_id uuid not null references tarefix.mentorados(id) on delete cascade,
  em           timestamptz not null default now(),
  instalado    boolean not null default false
);
create index if not exists mentoria_acessos_mentorado_idx on tarefix.mentoria_acessos(mentorado_id, em desc);
alter table tarefix.mentoria_acessos enable row level security;
revoke all on tarefix.mentoria_acessos from anon, authenticated;
grant all on tarefix.mentoria_acessos to service_role;
