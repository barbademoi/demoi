-- BarberMeta Card 2.0 — Schema inicial
-- Habilita extensão UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABELAS
-- ============================================================

create table barbearias (
  id            uuid default uuid_generate_v4() primary key,
  nome          text not null,
  logo_url      text,
  cor_principal text not null default '#2563EB',
  created_at    timestamptz default now() not null
);

-- Donos (vinculados ao Supabase Auth)
create table usuarios (
  id            uuid references auth.users on delete cascade primary key,
  barbearia_id  uuid references barbearias(id) on delete cascade not null,
  email         text not null,
  created_at    timestamptz default now() not null
);

-- Barbeiros com link único sem senha
create table barbeiros (
  id            uuid default uuid_generate_v4() primary key,
  barbearia_id  uuid references barbearias(id) on delete cascade not null,
  nome          text not null,
  foto_url      text,
  link_codigo   text unique not null,
  ativo         boolean default true not null,
  created_at    timestamptz default now() not null
);

-- Metas mensais coletivas por barbearia
create table metas (
  id               uuid default uuid_generate_v4() primary key,
  barbearia_id     uuid references barbearias(id) on delete cascade not null,
  mes              integer not null check (mes between 1 and 12),
  ano              integer not null check (ano >= 2024),
  meta_coletiva    numeric(12,2) not null default 0,
  premio_coletivo  text,
  created_at       timestamptz default now() not null,
  unique(barbearia_id, mes, ano)
);

-- Metas individuais Bronze/Prata/Ouro por barbeiro por mês
create table metas_individuais (
  id             uuid default uuid_generate_v4() primary key,
  meta_id        uuid references metas(id) on delete cascade not null,
  barbeiro_id    uuid references barbeiros(id) on delete cascade not null,
  bronze_comm    numeric(12,2) not null default 0,
  bronze_premio  text,
  prata_comm     numeric(12,2) not null default 0,
  prata_premio   text,
  ouro_comm      numeric(12,2) not null default 0,
  ouro_premio    text,
  created_at     timestamptz default now() not null,
  unique(meta_id, barbeiro_id)
);

-- Lançamentos diários de comissão acumulada
create table lancamentos (
  id                   uuid default uuid_generate_v4() primary key,
  barbearia_id         uuid references barbearias(id) on delete cascade not null,
  barbeiro_id          uuid references barbeiros(id) on delete cascade not null,
  mes                  integer not null check (mes between 1 and 12),
  ano                  integer not null check (ano >= 2024),
  comissao_acumulada   numeric(12,2) not null default 0,
  modo                 text not null default 'direto' check (modo in ('direto', 'calculado')),
  -- Campos extras para modo calculado
  faturamento          numeric(12,2),
  perc_assinatura      numeric(5,2),
  perc_servico         numeric(5,2),
  perc_produto         numeric(5,2),
  updated_at           timestamptz default now() not null,
  created_at           timestamptz default now() not null,
  unique(barbearia_id, barbeiro_id, mes, ano)
);

-- ============================================================
-- ÍNDICES
-- ============================================================

create index idx_barbeiros_barbearia on barbeiros(barbearia_id);
create index idx_barbeiros_link     on barbeiros(link_codigo);
create index idx_metas_barbearia    on metas(barbearia_id, ano, mes);
create index idx_lancamentos_mes    on lancamentos(barbearia_id, ano, mes);
create index idx_lancamentos_barb   on lancamentos(barbeiro_id, ano, mes);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table barbearias       enable row level security;
alter table usuarios         enable row level security;
alter table barbeiros        enable row level security;
alter table metas            enable row level security;
alter table metas_individuais enable row level security;
alter table lancamentos      enable row level security;

-- Helper: retorna barbearia_id do usuário autenticado
create or replace function get_barbearia_id()
returns uuid language sql security definer stable as $$
  select barbearia_id from usuarios where id = auth.uid()
$$;

-- BARBEARIAS: dono vê e edita a própria
create policy "dono_select_barbearia" on barbearias
  for select using (id = get_barbearia_id());

create policy "dono_update_barbearia" on barbearias
  for update using (id = get_barbearia_id());

-- USUARIOS: cada um vê o próprio perfil
create policy "usuario_select_proprio" on usuarios
  for select using (id = auth.uid());

-- BARBEIROS: dono gerencia os seus; acesso anônimo por link_codigo
create policy "dono_all_barbeiros" on barbeiros
  for all using (barbearia_id = get_barbearia_id());

create policy "anon_select_barbeiro_por_link" on barbeiros
  for select using (true);  -- filtrado por link_codigo na query

-- METAS: dono gerencia; barbeiro lê (acesso anônimo via link)
create policy "dono_all_metas" on metas
  for all using (barbearia_id = get_barbearia_id());

create policy "anon_select_metas" on metas
  for select using (true);

-- METAS_INDIVIDUAIS: dono gerencia; acesso anônimo de leitura
create policy "dono_all_metas_individuais" on metas_individuais
  for all using (
    meta_id in (select id from metas where barbearia_id = get_barbearia_id())
  );

create policy "anon_select_metas_individuais" on metas_individuais
  for select using (true);

-- LANCAMENTOS: dono gerencia; acesso anônimo de leitura
create policy "dono_all_lancamentos" on lancamentos
  for all using (barbearia_id = get_barbearia_id());

create policy "anon_select_lancamentos" on lancamentos
  for select using (true);

-- ============================================================
-- TRIGGER: updated_at automático em lancamentos
-- ============================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger lancamentos_updated_at
  before update on lancamentos
  for each row execute function set_updated_at();

-- ============================================================
-- DADOS DE EXEMPLO — Demôi Barbearia
-- (Executar apenas em ambiente de desenvolvimento)
-- ============================================================

-- Para inserir dados de exemplo, use o script em:
-- supabase/seeds/demoi_seed.sql
