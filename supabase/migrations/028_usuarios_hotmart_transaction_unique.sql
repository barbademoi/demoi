-- 028_usuarios_hotmart_transaction_unique.sql
-- Garantia em nivel de DB pra idempotencia do webhook da Hotmart.
--
-- Antes desta migration, o handler dedupava por email. Se o mesmo evento de
-- compra chegasse com email corrigido (cliente trocou na Hotmart e re-disparo
-- aconteceu), podia gerar conta duplicada. Agora a coluna hotmart_transaction
-- vira chave de idempotencia: 2 linhas com a mesma transacao nao-nula sao
-- impossiveis.
--
-- Indice parcial (where hotmart_transaction is not null) permite N usuarios
-- legados sem transacao (NULL nao conflita com NULL em unique parcial).
--
-- Idempotente.

create unique index if not exists usuarios_hotmart_transaction_key
  on public.usuarios (hotmart_transaction)
  where hotmart_transaction is not null;

comment on index public.usuarios_hotmart_transaction_key is
  'Garante 1 usuario por transacao Hotmart. Webhook usa essa coluna como '
  'chave de idempotencia (1o lookup); fallback por email cobre cliente '
  'existente comprando produto novo.';
