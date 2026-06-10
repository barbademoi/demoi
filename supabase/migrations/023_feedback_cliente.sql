-- 023_feedback_cliente.sql
-- Feedback de Cliente: coleta pública via /c/[slug], sorteio de brindes,
-- funil de avaliação no Google e integração OPCIONAL com a gamificação.
--
-- Arquitetura:
--   - Colunas novas em `barbearias` (config: toggle, slug, mensagem, etc.)
--   - Tabela nova `brindes` (lista de brindes da barbearia + peso de sorteio)
--   - Tabela nova `feedbacks_cliente` (1 linha por feedback recebido)
--   - Coluna `campanha_servicos.eh_servico_feedback` (slot fixo do tipo PR #95)
--     pra reusar `controle_diario` ao conceder pontos sem código paralelo.
--
-- RLS: tudo por barbearia. INSERT público em `feedbacks_cliente` permitido
-- só via slug ativo (anon key).
--
-- Idempotente em tudo — safe pra rodar em produção mesmo se algo já existe.


-- ── barbearias: config do feedback ─────────────────────────────────────────
alter table barbearias
  add column if not exists feedback_ativo boolean not null default false,
  add column if not exists feedback_slug text,
  add column if not exists feedback_mensagem_pos text,
  add column if not exists feedback_google_review_url text,
  add column if not exists feedback_nota_minima_positivo integer not null default 4
    check (feedback_nota_minima_positivo between 1 and 5),
  add column if not exists feedback_gamificacao_ativa boolean not null default false,
  add column if not exists feedback_pontos_por_feedback integer not null default 10
    check (feedback_pontos_por_feedback >= 0),
  add column if not exists feedback_limite_diario_pontuavel integer not null default 5
    check (feedback_limite_diario_pontuavel >= 0);

-- slug é unique global pra resolver /c/[slug] sem conflito entre barbearias
create unique index if not exists barbearias_feedback_slug_uidx
  on barbearias (feedback_slug) where feedback_slug is not null;

comment on column barbearias.feedback_ativo is
  'Liga/desliga a coleta de feedback via /c/[slug]. Default false.';
comment on column barbearias.feedback_slug is
  'Slug público em /c/[slug]. Gerado a partir do nome da barbearia ao ativar. Único global.';
comment on column barbearias.feedback_gamificacao_ativa is
  'Quando true, feedback positivo (nota>=minima) com barbeiro identificado concede pontos via controle_diario.';


-- ── brindes ───────────────────────────────────────────────────────────────
create table if not exists brindes (
  id            uuid primary key default gen_random_uuid(),
  barbearia_id  uuid not null references barbearias(id) on delete cascade,
  nome          text not null check (length(trim(nome)) > 0),
  descricao     text,
  foto_url      text,
  peso          integer not null default 1 check (peso >= 1),  -- raridade no sorteio ponderado
  ativo         boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists brindes_barbearia_idx on brindes (barbearia_id);

comment on column brindes.peso is
  'Peso no sorteio ponderado. Maior peso = mais comum. Default 1 = uniforme.';

-- "Brinde mínimo garantido": atribuído pelo cron se o cliente não recebe nenhum
-- (ex: barbearia sem brindes ativos no momento do feedback). Adicionado depois
-- da tabela brindes pra ter a FK disponível.
alter table barbearias
  add column if not exists feedback_brinde_minimo_id uuid references brindes(id) on delete set null;


-- ── feedbacks_cliente ──────────────────────────────────────────────────────
create table if not exists feedbacks_cliente (
  id                    uuid primary key default gen_random_uuid(),
  barbearia_id          uuid not null references barbearias(id) on delete cascade,
  barbeiro_id           uuid references barbeiros(id) on delete set null,
  -- Avaliação
  estrelas              integer not null check (estrelas between 1 and 5),
  comentario            text,
  -- Identificação opcional do cliente
  nome_cliente          text,
  contato_cliente       text,
  -- Sorteio do brinde
  brinde_id             uuid references brindes(id) on delete set null,
  codigo_resgate        text unique,                  -- mostrado ao cliente p/ print
  brinde_usado          boolean not null default false,
  brinde_atribuido_em   timestamptz,                  -- when null + brinde_id null + age > 24h, cron atribui minimo
  -- Pós-envio
  foi_redirecionado_google boolean not null default false,  -- só informativo (n. >= minima)
  pontos_concedidos     integer not null default 0,   -- pra dashboard do gestor
  -- Painel do gestor
  lido                  boolean not null default false,
  arquivado             boolean not null default false,
  -- Metadados
  data                  date not null,                -- dia BRT em que foi enviado (sem fuso)
  created_at            timestamptz not null default now()
);

create index if not exists feedbacks_cliente_barbearia_idx
  on feedbacks_cliente (barbearia_id, created_at desc);
create index if not exists feedbacks_cliente_barbeiro_idx
  on feedbacks_cliente (barbeiro_id) where barbeiro_id is not null;
-- Pra o cron de "brinde mínimo" achar rapidamente os pendentes.
create index if not exists feedbacks_cliente_brinde_pendente_idx
  on feedbacks_cliente (created_at) where brinde_id is null;

comment on column feedbacks_cliente.data is
  'Dia (BRT) em que o cliente enviou o feedback. Usado pelo limite_diario_pontuavel '
  'e pelo INSERT em controle_diario. Coluna date (sem fuso) — gravada via dataLocalStr().';
comment on column feedbacks_cliente.codigo_resgate is
  'Código curto (8 chars) mostrado ao cliente pra apresentar na barbearia. '
  'NULL até o brinde ser atribuído.';


-- ── campanha_servicos: slot fixo de feedback (reusa PR #95) ────────────────
alter table campanha_servicos
  add column if not exists eh_servico_feedback boolean not null default false;

-- Garante: no máximo 1 serviço de feedback por campanha (slot único, igual
-- assinatura no PR #95). Index parcial faz o constraint.
create unique index if not exists campanha_servicos_um_feedback_por_campanha_uidx
  on campanha_servicos (campanha_id) where eh_servico_feedback = true;

comment on column campanha_servicos.eh_servico_feedback is
  'Slot fixo (1 por campanha) usado quando feedback_gamificacao_ativa concede '
  'pontos. Oculto da UI de Configurações da Campanha. Pontos do row = '
  'barbearias.feedback_pontos_por_feedback.';


-- ── RLS ────────────────────────────────────────────────────────────────────

-- brindes: dono só vê/edita os da própria barbearia
alter table brindes enable row level security;

drop policy if exists dono_acessa_brindes on brindes;
create policy dono_acessa_brindes
  on brindes for all
  using (
    barbearia_id in (
      select u.barbearia_id from usuarios u where u.id = auth.uid()
    )
  );

-- Leitura pública (anon) de brindes ativos via slug — pra sortear no /c/[slug].
-- Restrita a barbearia com feedback_ativo=true.
drop policy if exists anon_le_brindes_ativos_via_slug on brindes;
create policy anon_le_brindes_ativos_via_slug
  on brindes for select
  to anon
  using (
    ativo = true
    and barbearia_id in (
      select b.id from barbearias b
      where b.feedback_ativo = true and b.feedback_slug is not null
    )
  );

-- feedbacks_cliente: dono só vê/edita os da própria barbearia
alter table feedbacks_cliente enable row level security;

drop policy if exists dono_acessa_feedbacks_cliente on feedbacks_cliente;
create policy dono_acessa_feedbacks_cliente
  on feedbacks_cliente for all
  using (
    barbearia_id in (
      select u.barbearia_id from usuarios u where u.id = auth.uid()
    )
  );

-- INSERT público (anon) — só em barbearia com feedback_ativo=true.
drop policy if exists anon_insere_feedback_cliente on feedbacks_cliente;
create policy anon_insere_feedback_cliente
  on feedbacks_cliente for insert
  to anon
  with check (
    barbearia_id in (
      select b.id from barbearias b
      where b.feedback_ativo = true and b.feedback_slug is not null
    )
  );

-- Leitura pública mínima da barbearia (anon) via slug — pra renderizar a tela
-- pública sem expor dados do dono. Só o que a tela /c/[slug] precisa.
-- Implementação simples: lê toda a row, mas só de barbearias com feedback_ativo.
-- (As páginas Server Components do dono usam o supabase autenticado.)
drop policy if exists anon_le_barbearia_via_slug on barbearias;
create policy anon_le_barbearia_via_slug
  on barbearias for select
  to anon
  using (feedback_ativo = true and feedback_slug is not null);

-- Leitura pública de barbeiros ativos da barbearia (pra "Quem te atendeu?").
drop policy if exists anon_le_barbeiros_ativos_via_slug on barbeiros;
create policy anon_le_barbeiros_ativos_via_slug
  on barbeiros for select
  to anon
  using (
    ativo = true
    and barbearia_id in (
      select b.id from barbearias b
      where b.feedback_ativo = true and b.feedback_slug is not null
    )
  );
