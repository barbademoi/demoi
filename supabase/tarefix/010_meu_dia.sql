-- =====================================================================
-- TAREFIX — 010 · Meu dia (uso pessoal), categorias, checklist e cadastro
--
-- Meu dia: cada dono ganha um "colaborador de si mesmo" (eh_dono = true),
-- reaproveitando tarefas, termômetro, mês e notificações. Ele não aparece
-- na equipe, no painel, no mês da equipe nem nas sugestões.
--
-- categorias          → cores para organizar (Barbearia, Pessoal, Saúde…)
-- checklist           → subitens da tarefa (modelo/avulsa: lista de textos;
--                       tarefas_dia: [{"t": texto, "f": feito}])
-- tarefas_avulsas.data sem data = "Algum dia" (caixa de ideias)
-- status 'adiada'     → tarefa empurrada para amanhã (não conta no %)
-- ajustada            → horário mudado só naquele dia (+1h): a sincronização
--                       com o modelo não desfaz
-- veio_de             → avulsa que passou de um dia anterior
-- empresas.pessoal    → lembretes do Meu dia
-- cadastros           → controle de abuso do cadastro público (só service role)
-- =====================================================================

alter table tarefix.colaboradores add column if not exists eh_dono boolean not null default false;
alter table tarefix.colaboradores add column if not exists dono_id uuid references tarefix.donos(id) on delete cascade;
create unique index if not exists colaboradores_eu_idx on tarefix.colaboradores(dono_id) where eh_dono;

create table if not exists tarefix.categorias (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references tarefix.empresas(id) on delete cascade,
  nome       text not null check (char_length(nome) between 1 and 30),
  cor        text not null default '#5B3DF5' check (cor ~ '^#[0-9A-Fa-f]{6}$'),
  ordem      int not null default 0,
  criado_em  timestamptz not null default now()
);
create index if not exists categorias_empresa_idx on tarefix.categorias(empresa_id);
alter table tarefix.categorias enable row level security;
drop policy if exists categorias_dono on tarefix.categorias;
create policy categorias_dono on tarefix.categorias for all to authenticated
  using (empresa_id = tarefix.minha_empresa()) with check (empresa_id = tarefix.minha_empresa());
grant select, insert, update, delete on tarefix.categorias to authenticated;
grant all on tarefix.categorias to service_role;
revoke all on tarefix.categorias from anon;

alter table tarefix.tarefas_modelo  add column if not exists categoria_id uuid references tarefix.categorias(id) on delete set null;
alter table tarefix.tarefas_avulsas add column if not exists categoria_id uuid references tarefix.categorias(id) on delete set null;
alter table tarefix.tarefas_dia     add column if not exists categoria_id uuid references tarefix.categorias(id) on delete set null;

alter table tarefix.tarefas_modelo  add column if not exists checklist text[] not null default '{}';
alter table tarefix.tarefas_avulsas add column if not exists checklist text[] not null default '{}';
alter table tarefix.tarefas_dia     add column if not exists checklist jsonb not null default '[]'::jsonb;

alter table tarefix.tarefas_avulsas alter column data drop not null;

alter table tarefix.tarefas_dia drop constraint if exists tarefas_dia_status_check;
alter table tarefix.tarefas_dia add constraint tarefas_dia_status_check check (status in ('pendente', 'feita', 'reprovada', 'adiada'));
alter table tarefix.tarefas_dia add column if not exists ajustada boolean not null default false;
alter table tarefix.tarefas_dia add column if not exists veio_de date;

alter table tarefix.empresas add column if not exists pessoal jsonb not null default '{}'::jsonb;

create table if not exists tarefix.cadastros (
  id        bigint generated always as identity primary key,
  ip_hash   text not null,
  criado_em timestamptz not null default now()
);
create index if not exists cadastros_ip_idx on tarefix.cadastros(ip_hash, criado_em);
alter table tarefix.cadastros enable row level security;
revoke all on tarefix.cadastros from anon, authenticated;
grant all on tarefix.cadastros to service_role;

-- Contas criadas só pelo Tarefix (mentorado com e-mail novo) não têm cadastro
-- no BarberMeta: marca como "só Tarefix" para o BarberMeta mandá-las de volta.
-- (Só roda onde existe a tabela de contas do BarberMeta.)
do $$
begin
  if to_regclass('public.usuarios') is not null then
    update auth.users u
       set raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb) || '{"tarefix_only": true}'::jsonb
      from tarefix.donos d
     where d.id = u.id
       and not exists (select 1 from public.usuarios pu where pu.id = u.id)
       and not exists (select 1 from tarefix.admins a where a.user_id = u.id)
       and coalesce((u.raw_app_meta_data ->> 'tarefix_only')::boolean, false) = false;
  end if;
end $$;
