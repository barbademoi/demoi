-- =====================================================================
-- TAREFIX — 009 · Acessos de mentorados
--
-- admins          → quem pode conceder/suspender acesso de outras empresas
--                   (só a service role lê). Entra como admin o dono da
--                   empresa mais antiga (quem instalou o Tarefix).
-- empresas.ativo  → empresa suspensa: o dono não entra e os links dos
--                   colaboradores param de funcionar (dados ficam guardados).
-- Pode rodar mais de uma vez.
-- =====================================================================

create table if not exists tarefix.admins (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now()
);
alter table tarefix.admins enable row level security;
revoke all on tarefix.admins from anon, authenticated;
grant all on tarefix.admins to service_role;

insert into tarefix.admins (user_id)
select d.id
from tarefix.donos d
join tarefix.empresas e on e.id = d.empresa_id
order by e.criado_em
limit 1
on conflict do nothing;

alter table tarefix.empresas add column if not exists ativo boolean not null default true;
alter table tarefix.empresas add column if not exists criado_por uuid references auth.users(id) on delete set null;
