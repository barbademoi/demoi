-- =====================================================================
-- TAREFIX — 001 · Estrutura
-- Mora no MESMO projeto Supabase do BarberMeta, mas isolado no schema
-- "tarefix": nenhuma tabela do BarberMeta é lida ou alterada.
-- Toda tabela tem empresa_id: a V1 tem 1 empresa, mas nada impede várias.
-- Datas "do dia" são sempre no fuso America/Sao_Paulo (ver tarefix.hoje_sp()).
-- =====================================================================

create schema if not exists tarefix;
grant usage on schema tarefix to authenticated, service_role;

-- Data/hora de referência no fuso fixo do produto.
create or replace function tarefix.agora_sp() returns timestamp
language sql stable as $$ select (now() at time zone 'America/Sao_Paulo') $$;

create or replace function tarefix.hoje_sp() returns date
language sql stable as $$ select (now() at time zone 'America/Sao_Paulo')::date $$;

-- ---------------------------------------------------------------------
-- empresas
-- ---------------------------------------------------------------------
create table tarefix.empresas (
  id                 uuid primary key default gen_random_uuid(),
  nome               text not null,
  logo_url           text,
  horario_fechamento time not null default '20:00',
  tom_mensagens      text not null default 'zoeira'
                     check (tom_mensagens in ('zoeira', 'neutro')),
  criado_em          timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- donos (id = auth.users.id)
-- ---------------------------------------------------------------------
create table tarefix.donos (
  id         uuid primary key references auth.users(id) on delete cascade,
  empresa_id uuid not null references tarefix.empresas(id) on delete cascade,
  nome       text not null,
  email      text not null
);
create index donos_empresa_idx on tarefix.donos(empresa_id);

-- ---------------------------------------------------------------------
-- funcoes
-- ---------------------------------------------------------------------
create table tarefix.funcoes (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references tarefix.empresas(id) on delete cascade,
  nome       text not null,
  descricao  text,
  ativo      boolean not null default true,
  criado_em  timestamptz not null default now()
);
create index funcoes_empresa_idx on tarefix.funcoes(empresa_id);

-- ---------------------------------------------------------------------
-- colaboradores
-- Não usam Supabase Auth: acesso por /c/[token] + PIN (validado no servidor).
-- pin_tentativas / pin_bloqueado_ate: bloqueio de 5 min após 5 PINs errados.
-- ---------------------------------------------------------------------
create table tarefix.colaboradores (
  id                uuid primary key default gen_random_uuid(),
  empresa_id        uuid not null references tarefix.empresas(id) on delete cascade,
  funcao_id         uuid references tarefix.funcoes(id) on delete set null,
  nome              text not null,
  foto_url          text,
  token_acesso      text not null unique
                    default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  pin_hash          text,
  pin_tentativas    int not null default 0,
  pin_bloqueado_ate timestamptz,
  ativo             boolean not null default true,
  criado_em         timestamptz not null default now()
);
create index colaboradores_empresa_idx on tarefix.colaboradores(empresa_id);

-- ---------------------------------------------------------------------
-- tarefas_modelo (recorrentes por dia da semana)
-- ---------------------------------------------------------------------
create table tarefix.tarefas_modelo (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references tarefix.empresas(id) on delete cascade,
  colaborador_id uuid not null references tarefix.colaboradores(id) on delete cascade,
  titulo         text not null,
  descricao      text,
  dias_semana    int[] not null default '{1,2,3,4,5,6}',
  exige_foto     boolean not null default false,
  ativo          boolean not null default true,
  ordem          int not null default 0,
  criado_em      timestamptz not null default now(),
  constraint dias_semana_validos check (dias_semana <@ array[0,1,2,3,4,5,6])
);
create index tarefas_modelo_colab_idx on tarefix.tarefas_modelo(colaborador_id);

-- ---------------------------------------------------------------------
-- tarefas_avulsas (uma data específica)
-- ---------------------------------------------------------------------
create table tarefix.tarefas_avulsas (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references tarefix.empresas(id) on delete cascade,
  colaborador_id uuid not null references tarefix.colaboradores(id) on delete cascade,
  titulo         text not null,
  descricao      text,
  data           date not null,
  exige_foto     boolean not null default false,
  criado_em      timestamptz not null default now()
);
create index tarefas_avulsas_colab_data_idx on tarefix.tarefas_avulsas(colaborador_id, data);

-- ---------------------------------------------------------------------
-- folgas (dia sem tarefas; não entra no cálculo)
-- ---------------------------------------------------------------------
create table tarefix.folgas (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references tarefix.empresas(id) on delete cascade,
  colaborador_id uuid not null references tarefix.colaboradores(id) on delete cascade,
  data           date not null,
  unique (colaborador_id, data)
);

-- ---------------------------------------------------------------------
-- tarefas_dia (a "foto" das tarefas de cada colaborador em cada data)
-- Título/descrição/exige_foto são COPIADOS do modelo: editar o modelo
-- depois não altera dias passados.
-- ---------------------------------------------------------------------
create table tarefix.tarefas_dia (
  id                uuid primary key default gen_random_uuid(),
  empresa_id        uuid not null references tarefix.empresas(id) on delete cascade,
  colaborador_id    uuid not null references tarefix.colaboradores(id) on delete cascade,
  data              date not null,
  origem            text not null check (origem in ('modelo', 'avulsa')),
  origem_id         uuid not null,
  titulo            text not null,
  descricao         text,
  exige_foto        boolean not null default false,
  ordem             int not null default 0,
  status            text not null default 'pendente'
                    check (status in ('pendente', 'feita', 'reprovada')),
  feita_em          timestamptz,
  foto_path         text,
  motivo_reprovacao text,
  reprovada_em      timestamptz,
  unique (colaborador_id, data, origem, origem_id),
  constraint reprovacao_com_motivo check (
    status <> 'reprovada' or length(trim(coalesce(motivo_reprovacao, ''))) > 0
  )
);
create index tarefas_dia_empresa_data_idx on tarefix.tarefas_dia(empresa_id, data);
create index tarefas_dia_colab_data_idx   on tarefix.tarefas_dia(colaborador_id, data);

-- ---------------------------------------------------------------------
-- extras (não entram no percentual; contador separado)
-- ---------------------------------------------------------------------
create table tarefix.extras (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references tarefix.empresas(id) on delete cascade,
  colaborador_id uuid not null references tarefix.colaboradores(id) on delete cascade,
  data           date not null default tarefix.hoje_sp(),
  descricao      text not null,
  foto_path      text,
  status         text not null default 'pendente'
                 check (status in ('pendente', 'aprovada', 'recusada')),
  criado_em      timestamptz not null default now()
);
create index extras_empresa_data_idx on tarefix.extras(empresa_id, data);
create index extras_colab_data_idx   on tarefix.extras(colaborador_id, data);

-- ---------------------------------------------------------------------
-- bonus_config (uma por empresa)
-- niveis: [{"percentual": 90, "premio": "R$ 50"}, ...]
-- ---------------------------------------------------------------------
create table tarefix.bonus_config (
  id                        uuid primary key default gen_random_uuid(),
  empresa_id                uuid not null unique references tarefix.empresas(id) on delete cascade,
  ativo                     boolean not null default false,
  mostrar_para_colaborador  boolean not null default true,
  niveis                    jsonb not null default '[]'::jsonb,
  constraint niveis_e_lista check (jsonb_typeof(niveis) = 'array')
);

-- ---------------------------------------------------------------------
-- avisos (sininho do dono)
-- chave: evita duplicar avisos gerados de forma preguiçosa
-- (ex.: 'fechamento:2026-11-12'). Nula para avisos comuns.
-- ---------------------------------------------------------------------
create table tarefix.avisos (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references tarefix.empresas(id) on delete cascade,
  tipo       text not null check (tipo in ('fechamento_dia', 'extra_nova', 'foto_enviada', 'geral')),
  texto      text not null,
  link       text,
  chave      text,
  lido       boolean not null default false,
  criado_em  timestamptz not null default now(),
  unique (empresa_id, chave)
);
create index avisos_empresa_lido_idx on tarefix.avisos(empresa_id, lido, criado_em desc);

-- ---------------------------------------------------------------------
-- meses_fechados (uma linha por colaborador por mês fechado)
-- ---------------------------------------------------------------------
create table tarefix.meses_fechados (
  id               uuid primary key default gen_random_uuid(),
  empresa_id       uuid not null references tarefix.empresas(id) on delete cascade,
  colaborador_id   uuid not null references tarefix.colaboradores(id) on delete cascade,
  ano_mes          text not null check (ano_mes ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  percentual_final numeric(5,2) not null,
  extras_aprovadas int not null default 0,
  bonus_atingido   jsonb,               -- {"percentual": 90, "premio": "R$ 50"} ou null
  fechado_em       timestamptz not null default now(),
  unique (colaborador_id, ano_mes)
);
create index meses_fechados_empresa_idx on tarefix.meses_fechados(empresa_id, ano_mes);

-- =====================================================================
-- Regras de integridade no banco
-- =====================================================================

-- Mês fechado? (por empresa; basta existir uma linha daquele ano_mes)
create or replace function tarefix.mes_fechado(p_empresa uuid, p_data date)
returns boolean language sql stable security definer set search_path = tarefix as $$
  select exists (
    select 1 from tarefix.meses_fechados
    where empresa_id = p_empresa and ano_mes = to_char(p_data, 'YYYY-MM')
  )
$$;

-- Depois de fechar o mês, nada daquele mês pode ser alterado.
create or replace function tarefix.trava_mes_fechado()
returns trigger language plpgsql as $$
declare
  r record;
begin
  if tg_op = 'DELETE' then r := old; else r := new; end if;
  if tarefix.mes_fechado(r.empresa_id, r.data) then
    raise exception 'O mês % já foi fechado e não pode ser alterado.', to_char(r.data, 'MM/YYYY')
      using errcode = 'P0001';
  end if;
  if tg_op = 'UPDATE' and (old.data <> new.data) and tarefix.mes_fechado(old.empresa_id, old.data) then
    raise exception 'O mês % já foi fechado e não pode ser alterado.', to_char(old.data, 'MM/YYYY')
      using errcode = 'P0001';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

create trigger tarefas_dia_trava_mes before insert or update or delete on tarefix.tarefas_dia
  for each row execute function tarefix.trava_mes_fechado();
create trigger extras_trava_mes before insert or update or delete on tarefix.extras
  for each row execute function tarefix.trava_mes_fechado();
create trigger folgas_trava_mes before insert or update or delete on tarefix.folgas
  for each row execute function tarefix.trava_mes_fechado();
create trigger avulsas_trava_mes before insert or update or delete on tarefix.tarefas_avulsas
  for each row execute function tarefix.trava_mes_fechado();

-- Marcar folga apaga as tarefas já geradas daquele dia (ele não conta).
create or replace function tarefix.folga_limpa_tarefas()
returns trigger language plpgsql as $$
begin
  delete from tarefix.tarefas_dia
   where colaborador_id = new.colaborador_id and data = new.data;
  return new;
end $$;

create trigger folgas_limpa_tarefas after insert on tarefix.folgas
  for each row execute function tarefix.folga_limpa_tarefas();

-- empresa_id das tabelas filhas tem que bater com o do colaborador
-- (impede, no futuro multiempresa, misturar dados entre empresas).
create or replace function tarefix.confere_empresa_colaborador()
returns trigger language plpgsql as $$
begin
  if not exists (
    select 1 from tarefix.colaboradores c
     where c.id = new.colaborador_id and c.empresa_id = new.empresa_id
  ) then
    raise exception 'colaborador não pertence a esta empresa';
  end if;
  return new;
end $$;

create trigger tarefas_modelo_confere before insert or update on tarefix.tarefas_modelo
  for each row execute function tarefix.confere_empresa_colaborador();
create trigger tarefas_avulsas_confere before insert or update on tarefix.tarefas_avulsas
  for each row execute function tarefix.confere_empresa_colaborador();
create trigger folgas_confere before insert or update on tarefix.folgas
  for each row execute function tarefix.confere_empresa_colaborador();
create trigger tarefas_dia_confere before insert or update on tarefix.tarefas_dia
  for each row execute function tarefix.confere_empresa_colaborador();
create trigger extras_confere before insert or update on tarefix.extras
  for each row execute function tarefix.confere_empresa_colaborador();
create trigger meses_fechados_confere before insert or update on tarefix.meses_fechados
  for each row execute function tarefix.confere_empresa_colaborador();

-- funcao_id do colaborador tem que ser da mesma empresa
create or replace function tarefix.confere_empresa_funcao()
returns trigger language plpgsql as $$
begin
  if new.funcao_id is not null and not exists (
    select 1 from tarefix.funcoes f where f.id = new.funcao_id and f.empresa_id = new.empresa_id
  ) then
    raise exception 'função não pertence a esta empresa';
  end if;
  return new;
end $$;

create trigger colaboradores_confere_funcao before insert or update on tarefix.colaboradores
  for each row execute function tarefix.confere_empresa_funcao();

-- Usado pela tela /tarefix/instalar para saber se este SQL já rodou
-- (fica em public porque o schema tarefix pode ainda não estar exposto na API).
create or replace function public.tarefix_instalado() returns text
language sql stable as $$ select '1' $$;
revoke all on function public.tarefix_instalado() from public, anon, authenticated;
grant execute on function public.tarefix_instalado() to service_role;
