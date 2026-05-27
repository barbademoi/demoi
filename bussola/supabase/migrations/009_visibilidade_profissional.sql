-- Bússola — Ajuste C: transparência total na timeline do profissional
-- Rodar no SQL Editor do Supabase.

alter table estabelecimentos
  add column if not exists mostrar_negativos_profissional boolean default true,
  add column if not exists mostrar_observacoes_profissional boolean default true,
  add column if not exists atraso_negativo_minutos integer default 5;

alter table feedbacks
  add column if not exists visivel_profissional_em timestamptz;

-- Backfill: feedbacks individuais já existentes continuam visíveis
-- (usam a data de criação como momento de visibilidade).
update feedbacks
  set visivel_profissional_em = created_at
  where escopo = 'individual'
    and deletado_em is null
    and visivel_profissional_em is null;
