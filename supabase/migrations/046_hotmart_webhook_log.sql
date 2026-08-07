-- 046_hotmart_webhook_log.sql
-- DIAGNÓSTICO TEMPORÁRIO: guarda o payload cru dos eventos da Hotmart pra
-- descobrir, com dado real, qual campo distingue MENSAL de ANUAL dentro do
-- produto de assinatura (8272423).
--
-- POR QUE UMA TABELA E NÃO SÓ console.log
-- Log de servidor na Vercel é volátil e difícil de garimpar. Aqui o payload
-- fica consultável no SQL Editor, que é onde a conferência vai acontecer.
--
-- NÃO MUDA NENHUMA REGRA DE ACESSO. Esta migration só cria a tabela; o webhook
-- passa a gravar aqui antes de seguir o fluxo que já existia, e uma falha na
-- gravação nunca derruba o webhook.
--
-- DADO PESSOAL: o payload da Hotmart traz documento, telefone e endereço do
-- comprador. O webhook mascara esses campos ANTES de gravar — pro diagnóstico
-- só interessam produto, preço, periodicidade e assinatura. O e-mail fica em
-- claro de propósito: é ele que permite localizar depois a conta criada pela
-- compra de teste (que, até a Parte 2 entrar, nasce vitalícia por default).
--
-- RLS ligada e SEM policies: ninguém autenticado lê: só o service_role, que a
-- ignora. Tabela de vida curta — dá pra dropar depois de cravado o campo.

create table if not exists public.hotmart_webhook_log (
  id             uuid primary key default gen_random_uuid(),
  recebido_em    timestamptz not null default now(),
  evento         text,
  product_id     text,
  transacao      text,
  email          text,
  -- Campos "candidatos" extraídos pra facilitar a leitura; a verdade completa
  -- fica em `payload`.
  preco_valor    numeric,
  preco_moeda    text,
  assinatura_id  text,
  periodicidade  text,
  formato        text,          -- 'form' (v1) | 'json' (v2)
  payload        jsonb not null
);

create index if not exists idx_hotmart_log_recebido on public.hotmart_webhook_log (recebido_em desc);
create index if not exists idx_hotmart_log_produto  on public.hotmart_webhook_log (product_id);

alter table public.hotmart_webhook_log enable row level security;
-- Sem policies de propósito: só o service_role (webhook) escreve e lê.

comment on table public.hotmart_webhook_log is
  'Log temporário do payload cru da Hotmart, pra identificar o campo de '
  'periodicidade (mensal x anual) do produto de assinatura. Documento, '
  'telefone e endereço são mascarados na gravação. Dropável depois.';
