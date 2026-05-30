-- Bússola — Ajuste: identificação simplificada (só nome + anônimo).
-- Remove contato_cliente; o sistema não preenche mais e a UI não exibe.

alter table feedbacks_cliente
  drop column if exists contato_cliente;
