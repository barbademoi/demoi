-- 038_usuarios_tipo_acesso.sql
-- Marcador de TIPO DE ACESSO da conta, pra distinguir CORTESIA/vitalício de
-- COMPRA. Hoje o BarberMeta é 100% vitalício (sem mensalidade — nada corta
-- acesso). Estas colunas são:
--   1) um marcador explícito (cortesia vs. compra), e
--   2) à prova de futuro: se algum dia entrar régua de validade/assinatura,
--      quem tiver tipo_acesso='vitalicio' fica FORA dessa checagem — nunca é
--      cortado por pagamento.
-- Idempotente. Aditivo — não altera nenhum dado existente além do backfill do
-- default (todo mundo hoje já é vitalício, então o default reflete a verdade).

alter table public.usuarios
  add column if not exists tipo_acesso text not null default 'vitalicio',
  add column if not exists origem text;

comment on column public.usuarios.tipo_acesso is
  'vitalicio = acesso permanente; nunca entra em régua de validade/assinatura. Default vitalicio.';
comment on column public.usuarios.origem is
  'Origem do acesso: cortesia | compra | hotmart:<transacao>. Distingue cortesia de compra.';

-- Concessão de CORTESIA VITALÍCIA (exemplo/execução — escopo 1 e-mail).
-- Só marca se a conta já existir (a linha em usuarios). Não cria conta aqui:
-- criação do login é via /admin/contas ou Supabase Auth (email_confirm=true).
update public.usuarios
set tipo_acesso = 'vitalicio', origem = 'cortesia'
where lower(email) = lower('vitoryuri2020@hotmail.com');
