-- 036_dias_sem_pontuacao.sql
-- Marca dias que o barbeiro fechou como "não pontuei" (intencional). Assim o
-- sistema para de alertar sobre esse dia, diferenciando de "esqueci de lançar".
-- Reversível: apagar a linha reabre o dia.
--
-- Não altera pontos/ranking. Fuso America/Sao_Paulo (a coluna é 'date' BRT).
-- RLS: dono da barbearia. O barbeiro age via server (admin) escopado pelo
-- link_codigo — mesmo padrão do canal de conduta.
-- Idempotente.

create table if not exists public.dias_sem_pontuacao (
  id            uuid default gen_random_uuid() primary key,
  barbearia_id  uuid not null references public.barbearias(id) on delete cascade,
  barbeiro_id   uuid not null references public.barbeiros(id) on delete cascade,
  data          date not null,
  created_at    timestamptz not null default now(),
  unique (barbeiro_id, data)
);
create index if not exists idx_dias_sem_pont on public.dias_sem_pontuacao(barbeiro_id, data);

alter table public.dias_sem_pontuacao enable row level security;

drop policy if exists "dono_all_dias_sem_pontuacao" on public.dias_sem_pontuacao;
create policy "dono_all_dias_sem_pontuacao" on public.dias_sem_pontuacao
  for all
  using (barbearia_id = get_barbearia_id())
  with check (barbearia_id = get_barbearia_id());
