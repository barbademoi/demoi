-- 018_meta_coletiva_tiers.sql
-- Adiciona Bronze e Prata na meta coletiva. A coluna `meta_coletiva` existente
-- continua sendo o valor do tier **Ouro** (e `premio_coletivo` o prêmio do
-- Ouro), preservando 100% dos dados já lançados. Bronze e Prata são novos,
-- opcionais, default 0 e NULL respectivamente.
--
-- Idempotente — seguro de rodar em produção mesmo que as colunas já existam.

alter table metas
  add column if not exists meta_coletiva_bronze   numeric(12,2) not null default 0,
  add column if not exists meta_coletiva_prata    numeric(12,2) not null default 0,
  add column if not exists premio_coletivo_bronze text,
  add column if not exists premio_coletivo_prata  text;

comment on column metas.meta_coletiva is
  'Valor do tier OURO da meta coletiva (campo legado mantido por compatibilidade).';
comment on column metas.meta_coletiva_bronze is
  'Valor do tier Bronze da meta coletiva.';
comment on column metas.meta_coletiva_prata is
  'Valor do tier Prata da meta coletiva.';
comment on column metas.premio_coletivo is
  'Prêmio do tier OURO da meta coletiva (campo legado mantido por compatibilidade).';
comment on column metas.premio_coletivo_bronze is
  'Prêmio do tier Bronze da meta coletiva.';
comment on column metas.premio_coletivo_prata is
  'Prêmio do tier Prata da meta coletiva.';
