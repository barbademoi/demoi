-- 010_usuarios_role.sql
-- Formaliza a coluna `usuarios.role` usada nas checagens de admin
-- (app/admin/treinamentos/*, RLS policy em 009_compras_mp.sql).
--
-- A coluna foi criada manualmente no Supabase de produção em algum momento
-- antes desta migration existir; este arquivo apenas garante que ela exista
-- ao reconstruir o schema do zero. Idempotente — seguro de rodar em prod
-- mesmo que a coluna já exista (IF NOT EXISTS).
--
-- Valores em uso hoje: 'admin' (e NULL pra usuários comuns).

alter table usuarios add column if not exists role text;

comment on column usuarios.role is
  'Role do usuário no sistema. NULL = dono comum de barbearia, ''admin'' = admin global (acessa /admin/*).';
