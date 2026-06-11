-- 026_campanha_quem_lanca.sql
-- Configuracao por campanha: quem lanca a pontuacao diaria?
--   'barbeiro' = barbeiro lanca pela tela /b/[codigo] (comportamento padrao)
--   'dono'     = so o dono lanca pela tela do dashboard
--
-- A regra eh aplicada no servidor (lancarDiaBarbeiro bloqueia quando ='dono')
-- e na UI (esconde aba "Lancar dia" no link do barbeiro).
--
-- Trocar o modo NAO apaga nem altera lancamentos ja feitos; so muda quem
-- pode lancar daqui pra frente.
--
-- Idempotente.

alter table campanha
  add column if not exists quem_lanca text not null default 'barbeiro';

-- Constraint de check (DROP+ADD pra ser idempotente).
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'campanha_quem_lanca_check') then
    alter table campanha drop constraint campanha_quem_lanca_check;
  end if;
  alter table campanha
    add constraint campanha_quem_lanca_check
    check (quem_lanca in ('barbeiro', 'dono'));
end $$;

comment on column campanha.quem_lanca is
  'Quem lanca a pontuacao diaria na campanha: barbeiro (default, pela tela /b/[codigo]) '
  'ou dono (somente pelo dashboard). Trocar o modo nao afeta lancamentos ja feitos.';
