-- 031_lancamentos_valores_separados.sql
-- Garante colunas separadas no acumulado mensal pra suportar modo_meta='ambos':
--   - valor_faturamento: R$ que a equipe faturou (so existe se modo permite)
--   - valor_comissao:    R$ que a equipe recebeu como comissao
--
-- A coluna legada `comissao_acumulada` continua existindo e e' a chave do
-- ranking/meta — apenas espelha valor_faturamento OU valor_comissao conforme
-- o (modo_meta + base_meta) da barbearia. Isso evita reescrever queries de
-- ranking/historico que ja apontam pra comissao_acumulada.
--
-- Backfill: como default = 'faturamento' (comportamento atual), copia o
-- valor existente de comissao_acumulada -> valor_faturamento. Quem ja usa
-- e' tratado como modo='faturamento' por padrao; se trocar pra 'comissao'
-- depois, valor_comissao comeca null e e' preenchido nas proximas edicoes.
--
-- Idempotente.

alter table public.lancamentos
  add column if not exists valor_faturamento numeric(12,2);

alter table public.lancamentos
  add column if not exists valor_comissao numeric(12,2);

-- Backfill so onde ainda nao foi populado, pra nao sobrescrever em re-runs.
update public.lancamentos
   set valor_faturamento = comissao_acumulada
 where valor_faturamento is null
   and comissao_acumulada is not null;

comment on column public.lancamentos.valor_faturamento is
  'R$ que o barbeiro faturou no mes/ciclo. So preenchido quando '
  'barbearias.modo_meta in (''faturamento'', ''ambos''). Espelhado em '
  'comissao_acumulada quando base_meta=''faturamento''.';

comment on column public.lancamentos.valor_comissao is
  'R$ de comissao que o barbeiro recebeu no mes/ciclo. So preenchido quando '
  'barbearias.modo_meta in (''comissao'', ''ambos''). Espelhado em '
  'comissao_acumulada quando base_meta=''comissao''.';
