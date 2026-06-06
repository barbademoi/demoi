-- Bússola — Adiciona coluna pra exibir senha temporária na tela /entrar
-- após redirect da Hotmart, e tabela compras_hotmart já existente.

alter table compras_hotmart
  add column if not exists senha_temporaria text;

-- A senha fica salva em texto plano apenas até o cliente criar a senha
-- definitiva (UPDATE para NULL acontece no endpoint /api/auth/criar-senha
-- e em /trocar-senha-obrigatorio). RLS na tabela bloqueia leitura
-- por qualquer client direto — apenas service role acessa.
