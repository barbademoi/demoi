-- IMPORTAÇÃO DE LANÇAMENTOS (preview restrito ao dono)
--
-- Separa faturamento e comissão também no nível diário. `valor` continua
-- existindo como espelho da base de meta/ranking, preservando consumidores
-- legados (cards e relatórios atuais).

alter table public.lancamentos_diarios
  add column if not exists valor_faturamento numeric(12,2),
  add column if not exists valor_comissao numeric(12,2);

-- Backfill do valor legado conforme a base efetiva de cada barbearia.
update public.lancamentos_diarios ld
   set valor_faturamento = ld.valor
  from public.barbearias b
 where b.id = ld.barbearia_id
   and ld.valor_faturamento is null
   and (
     b.modo_meta = 'faturamento'
     or (b.modo_meta = 'ambos' and b.base_meta = 'faturamento')
   );

update public.lancamentos_diarios ld
   set valor_comissao = ld.valor
  from public.barbearias b
 where b.id = ld.barbearia_id
   and ld.valor_comissao is null
   and (
     coalesce(b.modo_meta, 'comissao') = 'comissao'
     or (b.modo_meta = 'ambos' and coalesce(b.base_meta, 'comissao') = 'comissao')
   );

create table if not exists public.importacao_lotes (
  id                       uuid primary key default gen_random_uuid(),
  barbearia_id             uuid not null references public.barbearias(id) on delete cascade,
  usuario_id               uuid not null references auth.users(id) on delete cascade,
  arquivo_nome             text not null,
  arquivo_hash             text not null,
  tipo_valor               text not null check (tipo_valor in ('faturamento', 'comissao')),
  linhas_arquivo           integer not null default 0,
  lancamentos_previstos    integer not null default 0,
  lancamentos_aplicados    integer not null default 0,
  lancamentos_ignorados    integer not null default 0,
  total_aplicado           numeric(14,2) not null default 0,
  resumo                   jsonb not null default '{}'::jsonb,
  confirmado_em            timestamptz not null default now()
);

create index if not exists idx_importacao_lotes_barbearia_data
  on public.importacao_lotes (barbearia_id, confirmado_em desc);
create index if not exists idx_importacao_lotes_hash
  on public.importacao_lotes (barbearia_id, arquivo_hash);

create table if not exists public.importacao_itens (
  id                       uuid primary key default gen_random_uuid(),
  lote_id                  uuid not null references public.importacao_lotes(id) on delete cascade,
  barbearia_id             uuid not null references public.barbearias(id) on delete cascade,
  barbeiro_id              uuid not null references public.barbeiros(id) on delete cascade,
  data                     date not null,
  tipo_valor               text not null check (tipo_valor in ('faturamento', 'comissao')),
  valor_importado          numeric(12,2) not null,
  valor_anterior           numeric(12,2) not null default 0,
  valor_final              numeric(12,2) not null default 0,
  acao                     text not null check (acao in ('ignorar', 'substituir', 'somar')),
  status                   text not null check (status in ('aplicado', 'ignorado')),
  criado_em                timestamptz not null default now(),
  unique (lote_id, barbeiro_id, data, tipo_valor)
);

create index if not exists idx_importacao_itens_lote
  on public.importacao_itens (lote_id);

alter table public.importacao_lotes enable row level security;
alter table public.importacao_itens enable row level security;

drop policy if exists "dono_acessa_importacao_lotes" on public.importacao_lotes;
create policy "dono_acessa_importacao_lotes"
  on public.importacao_lotes
  for all
  using (
    usuario_id = auth.uid()
    and barbearia_id in (
      select u.barbearia_id from public.usuarios u where u.id = auth.uid()
    )
  )
  with check (
    usuario_id = auth.uid()
    and barbearia_id in (
      select u.barbearia_id from public.usuarios u where u.id = auth.uid()
    )
  );

drop policy if exists "dono_acessa_importacao_itens" on public.importacao_itens;
create policy "dono_acessa_importacao_itens"
  on public.importacao_itens
  for all
  using (
    barbearia_id in (
      select u.barbearia_id from public.usuarios u where u.id = auth.uid()
    )
  )
  with check (
    barbearia_id in (
      select u.barbearia_id from public.usuarios u where u.id = auth.uid()
    )
  );

comment on table public.importacao_lotes is
  'Auditoria dos lotes confirmados pela importacao CSV/XLSX.';
comment on table public.importacao_itens is
  'Antes/depois de cada item confirmado ou ignorado numa importacao.';
