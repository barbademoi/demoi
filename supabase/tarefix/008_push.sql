-- =====================================================================
-- TAREFIX — 008 · Notificações push no celular
--
-- push_config     → linha única com as chaves VAPID (geradas pelo servidor
--                   na primeira vez) e o segredo que o agendador usa para
--                   chamar /tarefix/api/push/tick. Só a service role lê.
-- push_inscricoes → cada celular/navegador que aceitou receber (do dono ou
--                   de um colaborador). Só a service role lê/escreve.
-- push_enviados   → o que já foi enviado (chave única), para não repetir.
-- empresas.push_tipos → quais avisos estão ligados.
-- Pode rodar mais de uma vez.
-- =====================================================================

create table if not exists tarefix.push_config (
  id            int primary key default 1 check (id = 1),
  vapid_publico text,
  vapid_privado text,
  segredo_cron  text not null default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  criado_em     timestamptz not null default now()
);
insert into tarefix.push_config (id) values (1) on conflict (id) do nothing;

create table if not exists tarefix.push_inscricoes (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references tarefix.empresas(id) on delete cascade,
  dono_id        uuid references tarefix.donos(id) on delete cascade,
  colaborador_id uuid references tarefix.colaboradores(id) on delete cascade,
  endpoint       text not null unique,
  p256dh         text not null,
  auth           text not null,
  navegador      text,
  criado_em      timestamptz not null default now(),
  constraint push_inscricao_de_alguem check ((dono_id is null) <> (colaborador_id is null))
);
create index if not exists push_inscricoes_colab_idx on tarefix.push_inscricoes(colaborador_id);
create index if not exists push_inscricoes_empresa_idx on tarefix.push_inscricoes(empresa_id);

create table if not exists tarefix.push_enviados (
  chave      text primary key,
  empresa_id uuid not null references tarefix.empresas(id) on delete cascade,
  enviado_em timestamptz not null default now()
);
create index if not exists push_enviados_quando_idx on tarefix.push_enviados(enviado_em);

alter table tarefix.empresas add column if not exists push_tipos jsonb not null
  default '{"inicio": true, "fechamento": true, "reprovada": true, "resumo": true, "extra": true}'::jsonb;

-- Ninguém além da service role mexe nessas tabelas (o app usa o servidor).
alter table tarefix.push_config     enable row level security;
alter table tarefix.push_inscricoes enable row level security;
alter table tarefix.push_enviados   enable row level security;
revoke all on tarefix.push_config, tarefix.push_inscricoes, tarefix.push_enviados from anon, authenticated;
grant all on tarefix.push_config, tarefix.push_inscricoes, tarefix.push_enviados to service_role;
