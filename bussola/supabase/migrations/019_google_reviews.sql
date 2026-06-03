-- Bússola — AJUSTE: redirecionamento pro Google Reviews
-- Não destrutivo. Adiciona configuração na empresa + tracking no feedback.

alter table estabelecimentos
  add column if not exists google_reviews_url text;

alter table feedbacks_cliente
  add column if not exists convidado_google boolean default false,
  add column if not exists clicou_google boolean default false;
