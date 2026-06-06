-- Bússola — Soft delete em mensagens dos colaboradores

alter table mensagens_colaboradores
  add column if not exists deletada boolean not null default false,
  add column if not exists deletada_em timestamptz null;

-- Index parcial pra acelerar listagem padrão (apenas não-deletadas).
create index if not exists idx_mensagens_nao_deletadas
  on mensagens_colaboradores(estabelecimento_id, lida)
  where deletada = false;

-- Permite que o dono DELETE definitivo via PostgREST. Continua só o dono
-- via RLS check (igual ao UPDATE existente).
drop policy if exists "Donos apagam mensagens" on mensagens_colaboradores;
create policy "Donos apagam mensagens"
  on mensagens_colaboradores for delete
  using (
    estabelecimento_id in (
      select id from estabelecimentos where dono_id = auth.uid()
    )
  );
