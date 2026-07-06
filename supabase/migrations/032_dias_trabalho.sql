-- 032_dias_trabalho.sql
-- Conceito de DIAS TRABALHADOS NO MÊS por barbeiro, pra o cálculo de
-- RITMO/PROJETADO ficar justo com quem folga mais.
--
-- A META TOTAL em R$ (Bronze/Prata/Ouro) NÃO muda — muda só a BASE de dias
-- usada pra estimar "quanto já deveria ter feito até hoje" e a "previsão de
-- fechamento". Hoje o sistema usa dias úteis (Seg–Sáb) do ciclo pra todos;
-- aqui passamos a poder usar os dias de trabalho reais de cada barbeiro.
--
-- Duas colunas, ambas OPCIONAIS (nullable, sem default) pra não quebrar quem
-- já usa:
--   barbearias.dias_trabalho_padrao — default da casa (ex: 26). Vale pra todo
--       barbeiro que não tiver valor próprio. NULL = comportamento atual
--       (cálculo por dias úteis do ciclo).
--   barbeiros.dias_trabalho_mes — override individual. Preencher só os
--       folguistas. NULL = herda o padrão da barbearia (que por sua vez, se
--       NULL, cai no comportamento atual).
--
-- Faixa 1..31 (um mês nunca tem mais que 31 dias de trabalho).
-- Idempotente — seguro rodar em produção.

alter table public.barbearias
  add column if not exists dias_trabalho_padrao smallint
    check (dias_trabalho_padrao is null or (dias_trabalho_padrao between 1 and 31));

alter table public.barbeiros
  add column if not exists dias_trabalho_mes smallint
    check (dias_trabalho_mes is null or (dias_trabalho_mes between 1 and 31));

comment on column public.barbearias.dias_trabalho_padrao is
  'Dias de trabalho padrão no mês da barbearia (default pra barbeiros sem valor próprio). NULL = usa dias úteis do ciclo (comportamento antigo).';
comment on column public.barbeiros.dias_trabalho_mes is
  'Dias que este barbeiro vai trabalhar no mês. NULL = herda dias_trabalho_padrao da barbearia.';
