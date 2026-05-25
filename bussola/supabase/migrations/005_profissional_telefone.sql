-- Bússola — telefone do profissional (Prompt 4 reformulado)
-- Rodar no SQL Editor do Supabase.

alter table profissionais
  add column if not exists telefone text;
