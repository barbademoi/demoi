-- 035_evolucao_piso_minimo.sql
-- Piso mínimo de faturamento (no MÊS/CICLO ANTERIOR) para um barbeiro concorrer
-- ao destaque "Maior Evolução". Evita crescimento % gigante vindo de base
-- pequena (ex.: R$ 50 -> R$ 2.000). Só afeta a EVOLUÇÃO — pontuação e
-- faturamento não têm piso. Default R$ 500.
--
-- Só configuração/apresentação: não altera lançamentos, metas nem ranking.
-- Idempotente.

alter table public.barbearias
  add column if not exists evolucao_faturamento_minimo numeric(12,2) not null default 500;

comment on column public.barbearias.evolucao_faturamento_minimo is
  'Faturamento mínimo no ciclo anterior (R$) pra um barbeiro concorrer ao '
  'destaque "Maior Evolução". Default 500. Vale só pra evolução.';
