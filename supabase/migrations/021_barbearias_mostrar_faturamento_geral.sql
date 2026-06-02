-- 021_barbearias_mostrar_faturamento_geral.sql
-- Toggle por barbearia pra ocultar o faturamento geral da barbearia
-- (total em R$) das telas vistas pela equipe e do hero do dashboard.
--
-- Quando OFF:
--   - Dashboard hero: anel de progresso (%) sem o valor R$
--   - /b/[codigo] meta coletiva: barra + % (sem "R$ X / R$ Y")
--   - Cards PNG: barra + % (sem o R$ desenhado no canvas)
--   - Lançamento diário: card "Faturamento" do resumo some
-- Telas de EDIÇÃO (form "Total da barbearia" + MetasModal) ficam visíveis
-- pra o dono continuar lançando.
--
-- Default true: comportamento atual preservado.
-- Idempotente — seguro de rodar em produção mesmo que a coluna já exista.

alter table barbearias
  add column if not exists mostrar_faturamento_geral boolean not null default true;

comment on column barbearias.mostrar_faturamento_geral is
  'Liga/desliga a exibição do faturamento geral da barbearia (R$) no '
  'dashboard, tela do barbeiro e cards PNG. Default true.';
