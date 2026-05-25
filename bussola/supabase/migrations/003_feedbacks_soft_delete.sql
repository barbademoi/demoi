-- Bússola — soft delete de feedbacks (Prompt 3)
-- Rodar no SQL Editor do Supabase.

alter table feedbacks
  add column if not exists deletado_em timestamptz;

-- Índice pra acelerar as listagens/placar (filtram deletado_em is null).
create index if not exists feedbacks_estab_idx
  on feedbacks (estabelecimento_id, created_at desc)
  where deletado_em is null;

create index if not exists feedbacks_prof_idx
  on feedbacks (profissional_id, created_at desc)
  where deletado_em is null;
