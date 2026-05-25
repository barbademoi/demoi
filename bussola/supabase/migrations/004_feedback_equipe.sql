-- Bússola — feedback de equipe (Prompt 5 revisado)
-- Rodar no SQL Editor do Supabase.

-- Escopo: individual (sobre um profissional) ou equipe (sobre o coletivo).
alter table feedbacks
  add column if not exists escopo text default 'individual';

do $$
begin
  alter table feedbacks
    add constraint feedbacks_escopo_check check (escopo in ('individual', 'equipe'));
exception
  when duplicate_object then null;
end $$;

-- Feedback de equipe não tem profissional → permite null.
alter table feedbacks
  alter column profissional_id drop not null;

-- Soft delete (idempotente — já pode ter sido criado no Prompt 3).
alter table feedbacks
  add column if not exists deletado_em timestamptz;
