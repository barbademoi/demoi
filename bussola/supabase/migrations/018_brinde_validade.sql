-- Bússola — AJUSTE: validade configurável do brinde
-- Não destrutivo. Adiciona configuração na empresa + snapshot no feedback.

alter table estabelecimentos
  add column if not exists brinde_validade_dias integer default 30;

alter table feedbacks_cliente
  add column if not exists brinde_validade_dias integer;

-- Constraint de check (DROP+ADD idempotente).
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'brinde_validade_dias_check') then
    alter table estabelecimentos drop constraint brinde_validade_dias_check;
  end if;
  alter table estabelecimentos
    add constraint brinde_validade_dias_check
    check (brinde_validade_dias in (15, 30, 60, 90));
end $$;
