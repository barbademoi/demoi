-- 033_comportamento.sql
-- Módulo de METAS DE COMPORTAMENTO (conduta) — trilha PARALELA e PRIVADA.
--
-- PRINCÍPIO: comportamento NÃO soma/subtrai na pontuação de vendas, NÃO entra
-- em meta de faturamento, projetado nem no ranking público. É exclusivo do
-- DONO — o barbeiro NUNCA vê. Nenhuma tabela aqui é lida pela página pública
-- /b/[codigo] (que usa a anon key), porque NÃO criamos policy anônima: só o
-- dono autenticado (via get_barbearia_id()) enxerga.
--
-- Não toca em nenhuma tabela/coluna de vendas (lancamentos, metas, campanha,
-- controle_diario, metas_individuais). Isolamento total.
--
-- Idempotente — seguro rodar em produção.

-- Toggle da barbearia (default OFF: quem não ativar não vê nada novo).
alter table public.barbearias
  add column if not exists comportamento_ativo boolean not null default false;

comment on column public.barbearias.comportamento_ativo is
  'Liga o módulo privado de metas de comportamento (conduta). Default OFF. Não afeta vendas/ranking.';

-- Regras de conduta configuradas pelo dono (ex: "Chegou no horário" +10,
-- "Faltou sem avisar" -20). valor com sinal.
create table if not exists public.regras_conduta (
  id            uuid default gen_random_uuid() primary key,
  barbearia_id  uuid not null references public.barbearias(id) on delete cascade,
  nome          text not null,
  valor         numeric(10,2) not null default 0,
  ativo         boolean not null default true,
  created_at    timestamptz not null default now()
);
create index if not exists idx_regras_conduta_barbearia on public.regras_conduta(barbearia_id);

-- Ocorrências registradas pelo dono para um barbeiro. `valor` é um SNAPSHOT
-- (aplicado no momento do registro) — editar/apagar a regra depois não
-- reescreve o histórico. regra_id null = ajuste avulso (usa `descricao`).
create table if not exists public.ocorrencias_conduta (
  id            uuid default gen_random_uuid() primary key,
  barbearia_id  uuid not null references public.barbearias(id) on delete cascade,
  barbeiro_id   uuid not null references public.barbeiros(id) on delete cascade,
  regra_id      uuid references public.regras_conduta(id) on delete set null,
  descricao     text,
  valor         numeric(10,2) not null default 0,
  data          date not null,
  created_at    timestamptz not null default now()
);
create index if not exists idx_ocorrencias_conduta_barbearia on public.ocorrencias_conduta(barbearia_id, data);
create index if not exists idx_ocorrencias_conduta_barbeiro  on public.ocorrencias_conduta(barbeiro_id, data);

-- ── RLS: PRIVADO — SÓ O DONO ─────────────────────────────────────────────
-- Habilita RLS e cria APENAS a policy do dono (barbearia_id = get_barbearia_id()).
-- NÃO existe policy anônima aqui — logo a página pública do barbeiro (anon key,
-- sem sessão de dono) recebe get_barbearia_id() = NULL e não lê nada. Garante
-- que o barbeiro não acessa esses dados de forma alguma.
alter table public.regras_conduta      enable row level security;
alter table public.ocorrencias_conduta enable row level security;

drop policy if exists "dono_all_regras_conduta" on public.regras_conduta;
create policy "dono_all_regras_conduta" on public.regras_conduta
  for all
  using (barbearia_id = get_barbearia_id())
  with check (barbearia_id = get_barbearia_id());

drop policy if exists "dono_all_ocorrencias_conduta" on public.ocorrencias_conduta;
create policy "dono_all_ocorrencias_conduta" on public.ocorrencias_conduta
  for all
  using (barbearia_id = get_barbearia_id())
  with check (barbearia_id = get_barbearia_id());
