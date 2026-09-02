-- 058_lembrete_meta.sql
--
-- ADIAMENTO DO LEMBRETE "cadastre a meta do mês".
--
-- O lembrete aparece quando o ciclo vigente ainda não tem meta cadastrada e
-- some sozinho no instante em que ela é criada — a condição de saída é a
-- própria meta, não um botão de "não mostrar mais". Por isso aqui não existe
-- `sem_interesse` como no popup da Brindoleta: dispensar para sempre um
-- lembrete que existe justamente para evitar um mês sem meta seria desligar o
-- alarme e deixar o fogo.
--
-- O que existe é "hoje não". E ele é guardado no BANCO, não no navegador,
-- pelo mesmo motivo da migration 051: em localStorage a promessa vira "não
-- volta hoje NESTE aparelho", e o dono que adiou no computador leva o
-- lembrete de novo ao abrir no celular.
--
-- ── POR QUE A CHAVE INCLUI (mes, ano) ─────────────────────────────────────
-- O adiamento é por CICLO. Sem isso, adiar em setembro silenciaria também o
-- lembrete de outubro — e o lembrete de outubro é justamente o que impede o
-- mês novo de começar sem meta. O par (mes, ano) é o mesmo de `metas`: o
-- início do ciclo, já respeitando dia_fechamento.
--
-- Idempotente.

create table if not exists public.lembrete_meta_estado (
  usuario_id    uuid not null references auth.users(id) on delete cascade,
  mes           smallint not null check (mes between 1 and 12),
  ano           smallint not null check (ano between 2000 and 2100),

  -- Adiou no X: o lembrete só volta a partir daqui.
  adiado_ate    timestamptz not null,
  vezes         integer not null default 1,
  atualizado_em timestamptz not null default now(),

  primary key (usuario_id, mes, ano)
);

comment on table public.lembrete_meta_estado is
  'Até quando o lembrete de cadastrar a meta fica adiado, por usuário e por ciclo. No banco (e não no navegador) para o adiamento valer em qualquer aparelho.';
comment on column public.lembrete_meta_estado.adiado_ate is
  'O lembrete não aparece antes deste instante. Não existe dispensa permanente: quem some com o lembrete é a meta cadastrada.';

-- ── RLS: cada um só enxerga e escreve o PRÓPRIO adiamento ─────────────────
alter table public.lembrete_meta_estado enable row level security;

drop policy if exists "lembrete_meta_proprio_select" on public.lembrete_meta_estado;
create policy "lembrete_meta_proprio_select" on public.lembrete_meta_estado
  for select to authenticated
  using (usuario_id = auth.uid());

drop policy if exists "lembrete_meta_proprio_insert" on public.lembrete_meta_estado;
create policy "lembrete_meta_proprio_insert" on public.lembrete_meta_estado
  for insert to authenticated
  with check (usuario_id = auth.uid());

-- Update é necessário: adiar de novo no mesmo ciclo reescreve a data.
drop policy if exists "lembrete_meta_proprio_update" on public.lembrete_meta_estado;
create policy "lembrete_meta_proprio_update" on public.lembrete_meta_estado
  for update to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

-- ── Auto-conferência ──────────────────────────────────────────────────────
do $$
declare
  n_policies int;
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'lembrete_meta_estado'
  ) then
    raise exception '058: tabela lembrete_meta_estado não foi criada';
  end if;

  -- A PK precisa ser (usuario_id, mes, ano). Se alguém a reduzir a usuario_id,
  -- adiar um ciclo passaria a silenciar todos os seguintes.
  if (
    select count(*)
      from information_schema.key_column_usage k
      join information_schema.table_constraints c
        on c.constraint_name = k.constraint_name
       and c.constraint_schema = k.constraint_schema
     where c.table_schema = 'public'
       and c.table_name = 'lembrete_meta_estado'
       and c.constraint_type = 'PRIMARY KEY'
  ) <> 3 then
    raise exception '058: a chave primária tem que ser (usuario_id, mes, ano) — o adiamento é por ciclo';
  end if;

  if not exists (
    select 1 from pg_tables
    where schemaname = 'public' and tablename = 'lembrete_meta_estado' and rowsecurity
  ) then
    raise exception '058: RLS não está ligada em lembrete_meta_estado';
  end if;

  select count(*) into n_policies
  from pg_policies
  where schemaname = 'public' and tablename = 'lembrete_meta_estado';

  if n_policies <> 3 then
    raise exception '058: esperava 3 policies (select + insert + update), encontrei %', n_policies;
  end if;

  raise notice '058 ok: lembrete_meta_estado criada, chave por ciclo, RLS ligada.';
end $$;
