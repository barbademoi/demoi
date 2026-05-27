-- Bússola — Ajuste A: confirmação de leitura, resposta e notificações
-- Rodar no SQL Editor do Supabase.

alter table feedbacks
  add column if not exists lido_em timestamptz,
  add column if not exists resposta_profissional text,
  add column if not exists resposta_em timestamptz;

alter table estabelecimentos
  add column if not exists ultima_visita_home timestamptz;
