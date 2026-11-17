-- =====================================================================
-- TAREFIX — 011 · Mentoria
--
-- Só o admin usa (pelo servidor, com service role): RLS ligado e nenhuma
-- policy para o dono comum. O mentorado não tem conta: abre um link secreto
-- /tarefix/m/[token] (sem PIN).
--
-- mentorados           → pessoas acompanhadas (nome, WhatsApp, link)
-- missoes              → o que o admin pede: data única, dias da semana ou
--                        toda semana (com dia do prazo); prova (nenhuma/foto/
--                        texto) e se precisa de aprovação
-- missoes_mentorados   → para quem é cada missão (uma missão, vários)
-- entregas             → cada ocorrência por mentorado e prazo (gerada sob
--                        demanda): pendente → enviada → aprovada | devolvida
-- reunioes             → próxima(s) reunião(ões): quando + link
-- push_inscricoes      → passa a aceitar o aparelho do mentorado
-- =====================================================================

create table if not exists tarefix.mentorados (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references tarefix.empresas(id) on delete cascade, -- empresa do admin
  nome       text not null check (char_length(nome) between 1 and 80),
  whatsapp   text,
  token      text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  ativo      boolean not null default true,
  criado_em  timestamptz not null default now()
);
create index if not exists mentorados_empresa_idx on tarefix.mentorados(empresa_id);

create table if not exists tarefix.missoes (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references tarefix.empresas(id) on delete cascade,
  titulo      text not null check (char_length(titulo) between 1 and 140),
  descricao   text,
  tipo        text not null check (tipo in ('data', 'dias', 'semanal')),
  data        date,                -- tipo 'data'
  dias_semana int[] not null default '{}', -- tipo 'dias' (0=dom … 6=sáb)
  dia_prazo   smallint check (dia_prazo between 0 and 6), -- tipo 'semanal'
  hora        time,                -- opcional: "até às"
  prova       text not null default 'nenhuma' check (prova in ('nenhuma', 'foto', 'texto')),
  aprovacao   boolean not null default false,
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now(),
  constraint missao_prazo_valido check (
    (tipo = 'data' and data is not null) or
    (tipo = 'dias' and cardinality(dias_semana) > 0) or
    (tipo = 'semanal' and dia_prazo is not null)
  )
);
create index if not exists missoes_empresa_idx on tarefix.missoes(empresa_id);

create table if not exists tarefix.missoes_mentorados (
  missao_id    uuid not null references tarefix.missoes(id) on delete cascade,
  mentorado_id uuid not null references tarefix.mentorados(id) on delete cascade,
  criado_em    timestamptz not null default now(),
  primary key (missao_id, mentorado_id)
);
create index if not exists missoes_mentorados_mentorado_idx on tarefix.missoes_mentorados(mentorado_id);

create table if not exists tarefix.entregas (
  id           uuid primary key default gen_random_uuid(),
  missao_id    uuid not null references tarefix.missoes(id) on delete cascade,
  mentorado_id uuid not null references tarefix.mentorados(id) on delete cascade,
  prazo        date not null,
  status       text not null default 'pendente' check (status in ('pendente', 'enviada', 'aprovada', 'devolvida')),
  texto        text check (texto is null or char_length(texto) <= 2000),
  foto_path    text,
  enviada_em   timestamptz,
  decidida_em  timestamptz,
  motivo       text check (motivo is null or char_length(motivo) <= 300),
  criado_em    timestamptz not null default now(),
  unique (missao_id, mentorado_id, prazo)
);
create index if not exists entregas_mentorado_idx on tarefix.entregas(mentorado_id, prazo);

create table if not exists tarefix.reunioes (
  id           uuid primary key default gen_random_uuid(),
  mentorado_id uuid not null references tarefix.mentorados(id) on delete cascade,
  quando       timestamptz not null,
  link         text check (link is null or char_length(link) <= 500),
  criado_em    timestamptz not null default now()
);
create index if not exists reunioes_mentorado_idx on tarefix.reunioes(mentorado_id, quando);

do $$
declare t text;
begin
  foreach t in array array['mentorados', 'missoes', 'missoes_mentorados', 'entregas', 'reunioes'] loop
    execute format('alter table tarefix.%I enable row level security', t);
    execute format('revoke all on tarefix.%I from anon, authenticated', t);
    execute format('grant all on tarefix.%I to service_role', t);
  end loop;
end $$;

-- aparelho do mentorado também recebe push
alter table tarefix.push_inscricoes add column if not exists mentorado_id uuid references tarefix.mentorados(id) on delete cascade;
alter table tarefix.push_inscricoes drop constraint if exists push_inscricao_de_alguem;
alter table tarefix.push_inscricoes add constraint push_inscricao_de_alguem check (num_nonnulls(dono_id, colaborador_id, mentorado_id) = 1);
