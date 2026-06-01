-- 020_meses_fechados.sql
-- Travamento manual de meses já ajustados pra evitar edição acidental.
-- Por barbearia, mes, ano. Quando fechado: salvarMetas / salvarCampanha /
-- salvarComandasDia / definirAcumuladoMes retornam erro e a UI esconde
-- os botões de editar.
--
-- Reaberto pelo dono = simples delete da linha.
--
-- Idempotente — seguro de rodar em produção mesmo que já exista.

create table if not exists meses_fechados (
  id            uuid primary key default uuid_generate_v4(),
  barbearia_id  uuid not null references barbearias(id) on delete cascade,
  mes           integer not null check (mes between 1 and 12),
  ano           integer not null check (ano >= 2024),
  fechado_em    timestamptz not null default now(),
  fechado_por   uuid references auth.users(id) on delete set null,
  unique(barbearia_id, mes, ano)
);

alter table meses_fechados enable row level security;

do $$
begin
  create policy "dono_acessa_meses_fechados" on meses_fechados
    for all using (
      barbearia_id in (select barbearia_id from usuarios where id = auth.uid())
    );
exception
  when duplicate_object then null;
end $$;

comment on table meses_fechados is
  'Travamento manual de meses já fechados pelo dono. Linha presente = mês '
  'fechado pra (mes, ano) daquela barbearia. Apagar a linha = reabre.';
