-- 030_barbearias_modo_meta.sql
-- Permite que o dono escolha COMO acompanhar o desempenho da equipe:
--   - 'comissao' (default, comportamento atual): a coluna legada
--     lancamentos.comissao_acumulada SEMPRE representou comissao na prod,
--     entao quem ja usa cai aqui
--   - 'faturamento': rotulos e meta usam faturamento
--   - 'ambos': ambos os valores sao registrados; meta/ranking seguem o
--     base_meta (faturamento ou comissao)
--
-- O sistema NAO calcula nada — o valor e' o que o barbeiro/dono digitou.
-- Idempotente.

alter table public.barbearias
  add column if not exists modo_meta text default 'comissao';

alter table public.barbearias
  add column if not exists base_meta text default 'comissao';

-- Constraint defensiva (somente se ainda nao existe)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'barbearias_modo_meta_check'
  ) then
    alter table public.barbearias
      add constraint barbearias_modo_meta_check
      check (modo_meta in ('faturamento', 'comissao', 'ambos'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'barbearias_base_meta_check'
  ) then
    alter table public.barbearias
      add constraint barbearias_base_meta_check
      check (base_meta in ('faturamento', 'comissao'));
  end if;
end $$;

-- Backfill defensivo: barbearias ja existentes sem modo_meta -> 'comissao'.
-- Se a migration anterior ja rodou com default 'faturamento' e gravou
-- 'faturamento' em todas, este UPDATE corrige pra refletir o comportamento
-- real da prod. Restringe a quem NAO tocou explicitamente no campo.
update public.barbearias
   set modo_meta = 'comissao'
 where modo_meta = 'faturamento';

update public.barbearias
   set base_meta = 'comissao'
 where base_meta = 'faturamento';

comment on column public.barbearias.modo_meta is
  'Como o dono acompanha desempenho: faturamento | comissao | ambos. '
  'Default = comissao (comportamento legado: lancamentos.comissao_acumulada '
  'sempre representou comissao na prod).';

comment on column public.barbearias.base_meta is
  'Quando modo_meta=ambos, qual valor (faturamento ou comissao) define '
  'meta e ranking. O outro valor fica registrado so pra visualizacao.';
