-- 025_brinde_validade.sql
-- Validade configuravel do brinde do feedback de cliente.
--
-- Antes: brinde sem validade — cliente nao sabia ate quando podia resgatar
-- e a barbearia ficava exposta a resgates antigos.
-- Agora: o dono escolhe 15/30/60/90 dias (default 30). O valor vigente no
-- momento do feedback fica congelado em feedbacks_cliente.brinde_validade_dias
-- pra que mudar a config nao altere brindes ja sorteados.
--
-- Idempotente.

alter table barbearias
  add column if not exists brinde_validade_dias integer not null default 30;

-- Snapshot por feedback (null = ainda nao sorteado ou config antiga).
alter table feedbacks_cliente
  add column if not exists brinde_validade_dias integer;

-- Constraint de check em barbearias (DROP+ADD pra ser idempotente).
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'barbearias_brinde_validade_dias_check') then
    alter table barbearias drop constraint barbearias_brinde_validade_dias_check;
  end if;
  alter table barbearias
    add constraint barbearias_brinde_validade_dias_check
    check (brinde_validade_dias in (15, 30, 60, 90));
end $$;

comment on column barbearias.brinde_validade_dias is
  'Quantidade de dias que o cliente tem pra usar o brinde apos sorteio. '
  'Valores aceitos: 15/30/60/90. Snapshotado em feedbacks_cliente no envio.';
comment on column feedbacks_cliente.brinde_validade_dias is
  'Snapshot da validade vigente no momento do sorteio (em dias). NULL = sem brinde.';
