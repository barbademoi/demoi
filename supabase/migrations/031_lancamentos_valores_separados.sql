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
-- Backfill: como default = 'comissao' (lancamentos.comissao_acumulada
-- sempre representou comissao na prod), copia o valor existente
-- comissao_acumulada -> valor_comissao. Quem ja usa e' tratado como
-- modo='comissao' por padrao; se trocar pra 'faturamento' depois,
-- valor_faturamento comeca null e e' preenchido nas proximas edicoes.
--
-- Idempotente.

alter table public.lancamentos
  add column if not exists valor_faturamento numeric(12,2);

alter table public.lancamentos
  add column if not exists valor_comissao numeric(12,2);

-- Backfill principal: comissao_acumulada -> valor_comissao
update public.lancamentos
   set valor_comissao = comissao_acumulada
 where valor_comissao is null
   and comissao_acumulada is not null;

-- CORRECAO: se a versao anterior dessa migration ja rodou e backfillou
-- valor_faturamento por engano, limpa esses valores (que na verdade eram
-- comissao). So afeta linhas em que valor_faturamento == comissao_acumulada
-- — sinal de backfill automatico, nao de valor digitado depois.
update public.lancamentos
   set valor_faturamento = null
 where valor_faturamento is not null
   and valor_faturamento = comissao_acumulada
   and (valor_comissao is null or valor_comissao = comissao_acumulada);

comment on column public.lancamentos.valor_faturamento is
  'R$ que o barbeiro faturou no mes/ciclo. So preenchido quando '
  'barbearias.modo_meta in (''faturamento'', ''ambos''). Espelhado em '
  'comissao_acumulada quando base_meta=''faturamento''.';

comment on column public.lancamentos.valor_comissao is
  'R$ de comissao que o barbeiro recebeu no mes/ciclo. So preenchido quando '
  'barbearias.modo_meta in (''comissao'', ''ambos''). Espelhado em '
  'comissao_acumulada quando base_meta=''comissao''.';
