-- 030_barbearias_modo_meta.sql
-- Permite que o dono escolha COMO acompanhar o desempenho da equipe:
--   - 'faturamento' (default, comportamento atual): rotulos e meta usam
--     faturamento da equipe
--   - 'comissao': rotulos e meta usam comissao
--   - 'ambos': ambos os valores sao registrados; meta/ranking seguem o
--     base_meta (faturamento ou comissao)
--
-- O sistema NAO calcula nada — o valor e' o que o barbeiro/dono digitou.
-- Idempotente.

alter table public.barbearias
  add column if not exists modo_meta text default 'faturamento';

alter table public.barbearias
  add column if not exists base_meta text default 'faturamento';

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

comment on column public.barbearias.modo_meta is
  'Como o dono acompanha desempenho: faturamento | comissao | ambos. '
  'Default = faturamento (comportamento legado).';

comment on column public.barbearias.base_meta is
  'Quando modo_meta=ambos, qual valor (faturamento ou comissao) define '
  'meta e ranking. O outro valor fica registrado so pra visualizacao.';
