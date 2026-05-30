-- 019_barbearias_mostrar_ticket_medio.sql
-- Toggle por barbearia pra ativar/desativar a exibição do ticket médio
-- no dashboard, na tela do barbeiro e nos cards PNG.
--
-- Default false: quem nunca configurou continua sem ver. Quem quiser, ativa
-- em Configurações → Operação.
--
-- Idempotente — seguro de rodar em produção mesmo que a coluna já exista.

alter table barbearias
  add column if not exists mostrar_ticket_medio boolean not null default false;

comment on column barbearias.mostrar_ticket_medio is
  'Liga/desliga a exibição do ticket médio (faturamento ÷ atendimentos) no '
  'dashboard, tela do barbeiro e cards PNG. Default false.';
