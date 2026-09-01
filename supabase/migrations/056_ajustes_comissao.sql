-- 056_ajustes_comissao.sql
--
-- AUDITORIA DOS AJUSTES MANUAIS DE COMISSÃO BRUTA.
--
-- O módulo Financeiro passa a poder editar a comissão bruta de um colaborador
-- e essa edição grava em `lancamentos` — o MESMO valor que alimenta ranking,
-- meta e histórico. Não é um campo paralelo: é o número de verdade.
--
-- E é exatamente por isso que precisa de rastro. Comissão bruta é a base da
-- premiação: mexer nela mexe em quem ganha o prêmio do mês. Sem registro, um
-- ajuste de R$ 200 feito às pressas numa sexta-feira vira "o sistema calculou
-- errado" na segunda, e não há como distinguir erro de sistema de correção
-- manual legítima. Com registro, dá pra abrir e ver: quem, quando, de quanto
-- pra quanto.
--
-- Cada linha é UM ajuste. O histórico NÃO é editável nem apagável pela API:
-- há policy de select e de insert, e nenhuma de update ou delete. Auditoria
-- que o próprio auditado pode reescrever não é auditoria.
--
-- Idempotente.

create table if not exists public.ajustes_comissao (
  id             uuid primary key default gen_random_uuid(),
  barbearia_id   uuid not null references public.barbearias(id) on delete cascade,
  barbeiro_id    uuid not null references public.barbeiros(id) on delete cascade,

  -- Ciclo afetado, no mesmo par (mes, ano) que `lancamentos` usa: o INÍCIO do
  -- ciclo que contém a data, já respeitando dia_fechamento. Não é o mês do
  -- calendário nem o mês de hoje.
  mes            smallint not null check (mes between 1 and 12),
  ano            smallint not null check (ano between 2000 and 2100),

  -- Qual coluna de `lancamentos` o ajuste escreveu, conforme o modo_meta da
  -- barbearia: 'comissao' → valor_comissao, 'faturamento' → valor_faturamento.
  -- Nos dois casos comissao_acumulada é espelhada quando é a base da meta.
  campo          text not null check (campo in ('comissao', 'faturamento')),

  valor_anterior numeric(12,2) not null default 0,
  valor_novo     numeric(12,2) not null default 0,

  -- De onde veio o ajuste. Hoje só 'financeiro'; fica aberto pra quando o
  -- lançamento diário também passar a registrar.
  origem         text not null default 'financeiro',

  -- Quem editou. Fica como SET NULL pra que apagar um usuário não apague o
  -- histórico do que ele fez — o rastro do valor sobrevive à conta.
  usuario_id     uuid references auth.users(id) on delete set null,

  criado_em      timestamptz not null default now()
);

comment on table public.ajustes_comissao is
  'Rastro dos ajustes manuais de comissão bruta feitos pelo Financeiro. Só insert e select — nunca update/delete.';
comment on column public.ajustes_comissao.campo is
  'Coluna de lancamentos escrita: comissao (valor_comissao) ou faturamento (valor_faturamento).';

-- Consulta natural da tela: "os ajustes deste barbeiro neste ciclo, do mais
-- recente pro mais antigo".
create index if not exists idx_ajustes_comissao_barbeiro
  on public.ajustes_comissao(barbeiro_id, ano desc, mes desc, criado_em desc);
create index if not exists idx_ajustes_comissao_barbearia
  on public.ajustes_comissao(barbearia_id, criado_em desc);

-- ── RLS: só o dono da barbearia, e só pra ler e acrescentar ────────────────
alter table public.ajustes_comissao enable row level security;

drop policy if exists "dono_select_ajustes_comissao" on public.ajustes_comissao;
create policy "dono_select_ajustes_comissao" on public.ajustes_comissao
  for select
  using (barbearia_id = get_barbearia_id());

drop policy if exists "dono_insert_ajustes_comissao" on public.ajustes_comissao;
create policy "dono_insert_ajustes_comissao" on public.ajustes_comissao
  for insert
  with check (barbearia_id = get_barbearia_id());

-- Sem policy de update e sem policy de delete: com RLS ligada, a ausência de
-- policy é a proibição. Nem o dono reescreve o próprio histórico.

-- ── Auto-conferência ───────────────────────────────────────────────────────
do $$
declare
  n_policies int;
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'ajustes_comissao'
  ) then
    raise exception '056: tabela ajustes_comissao não foi criada';
  end if;

  if not exists (
    select 1 from pg_tables
    where schemaname = 'public' and tablename = 'ajustes_comissao' and rowsecurity
  ) then
    raise exception '056: RLS não está ligada em ajustes_comissao';
  end if;

  select count(*) into n_policies
  from pg_policies
  where schemaname = 'public' and tablename = 'ajustes_comissao';

  if n_policies <> 2 then
    raise exception '056: esperava exatamente 2 policies (select + insert), encontrei %', n_policies;
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'ajustes_comissao'
      and cmd in ('UPDATE', 'DELETE')
  ) then
    raise exception '056: há policy de update/delete em ajustes_comissao — auditoria não pode ser reescrita';
  end if;

  raise notice '056 ok: ajustes_comissao criada, RLS ligada, só select+insert.';
end $$;
