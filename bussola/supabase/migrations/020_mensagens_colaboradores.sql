-- Bússola — mensagens dos colaboradores pro dono
-- Via de mão dupla no link público /p/[slug].
-- Suporta envio anônimo (colaborador_id = NULL).

create table if not exists mensagens_colaboradores (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
  colaborador_id uuid null references profissionais(id) on delete set null,
  conteudo text not null check (length(trim(conteudo)) >= 20 and length(conteudo) <= 2000),
  anonimo boolean not null default false,
  lida boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_mensagens_estabelecimento
  on mensagens_colaboradores(estabelecimento_id);

create index if not exists idx_mensagens_lida
  on mensagens_colaboradores(estabelecimento_id, lida);

create index if not exists idx_mensagens_created
  on mensagens_colaboradores(estabelecimento_id, created_at desc);

alter table mensagens_colaboradores enable row level security;

-- Dono vê mensagens do seu estabelecimento.
drop policy if exists "Donos veem mensagens" on mensagens_colaboradores;
create policy "Donos veem mensagens"
  on mensagens_colaboradores for select
  using (
    estabelecimento_id in (
      select id from estabelecimentos where dono_id = auth.uid()
    )
  );

-- Dono atualiza status (marcar como lida).
drop policy if exists "Donos atualizam mensagens" on mensagens_colaboradores;
create policy "Donos atualizam mensagens"
  on mensagens_colaboradores for update
  using (
    estabelecimento_id in (
      select id from estabelecimentos where dono_id = auth.uid()
    )
  );

-- Inserção é feita via server action com admin client (não pela RLS pública).
-- Não criamos policy de INSERT pra anon. A action valida estabelecimento_id
-- a partir do slug do colaborador, então a integridade é garantida no server.
