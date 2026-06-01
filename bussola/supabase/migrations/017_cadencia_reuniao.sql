-- Bússola — AJUSTE J: cadências de reunião configuráveis
-- Não destrutivo. Adiciona cadencia_reuniao e dia_mes_reuniao.
-- Empresas existentes ficam com cadencia='semanal' (default).

alter table estabelecimentos
  add column if not exists cadencia_reuniao text default 'semanal',
  add column if not exists dia_mes_reuniao integer,
  add column if not exists incluir_domingos boolean default false;

-- Constraint na cadencia (DROP+ADD pra ser idempotente).
do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'cadencia_reuniao_check'
  ) then
    alter table estabelecimentos drop constraint cadencia_reuniao_check;
  end if;
  alter table estabelecimentos
    add constraint cadencia_reuniao_check
    check (cadencia_reuniao in ('diaria', 'semanal', 'quinzenal', 'mensal'));
end $$;

-- Constraint no dia do mês.
do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'dia_mes_reuniao_check'
  ) then
    alter table estabelecimentos drop constraint dia_mes_reuniao_check;
  end if;
  alter table estabelecimentos
    add constraint dia_mes_reuniao_check
    check (dia_mes_reuniao is null or (dia_mes_reuniao between 1 and 31));
end $$;
