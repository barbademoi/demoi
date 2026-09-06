-- 059_import_agenda_depara.sql
--
-- DE-PARA DE NOMES do relatório do Agenda Serviço → barbeiro do BarberMeta.
--
-- Até aqui, um nome que não batia exatamente só tinha duas saídas: renomear o
-- barbeiro no BarberMeta pra ficar igual ao do Agenda, ou conviver com ele
-- fora de toda importação. As duas são ruins. Renomear muda o nome que aparece
-- no ranking, no card de pagamento e na tela do próprio barbeiro só pra
-- agradar um relatório externo — a cauda balançando o cachorro. E conviver
-- significa faturamento entrando pela metade, todo dia, em silêncio.
--
-- Esta tabela é a terceira saída: o dono confirma UMA VEZ que "Carlos" do
-- Agenda é o "Carlos Eduardo" do BarberMeta, e daí em diante toda importação
-- sabe. Os dois sistemas continuam com os nomes que cada um quer.
--
-- ── UMA TABELA, TRÊS ESTADOS ──────────────────────────────────────────────
--   barbeiro_id preenchido      → confirmado: importa neste barbeiro.
--   ignorar = true              → o dono disse pra não perguntar mais (é uma
--                                 linha de total, um profissional que não
--                                 entra no BarberMeta, um serviço avulso).
--   barbeiro_id null + ignorar false → PENDENTE: apareceu no relatório, ainda
--                                 não foi resolvido. É o que a tela lista.
--
-- O pendente é registrado pelo próprio endpoint de importação, sem o dono
-- pedir. Sem isso a tela não teria o que mostrar: ela precisaria adivinhar
-- quais nomes o Agenda Serviço manda, e só a importação sabe disso.
--
-- Idempotente.

create table if not exists public.import_agenda_depara (
  id            uuid primary key default gen_random_uuid(),
  barbearia_id  uuid not null references public.barbearias(id) on delete cascade,

  -- Nome COMO VEM DO AGENDA, já normalizado (sem acento, sem caixa, sem
  -- espaço repetido) — é a chave de busca. O original fica em nome_exibicao
  -- pra tela mostrar o que o dono realmente vê no relatório dele.
  nome_origem    text not null check (char_length(nome_origem) between 1 and 200),
  nome_exibicao  text not null,

  -- NULL enquanto pendente. ON DELETE CASCADE: se o barbeiro for excluído, o
  -- vínculo morre junto — apontar para alguém que não existe mais seria pior
  -- que não apontar para ninguém, e o nome volta a ser perguntado.
  barbeiro_id   uuid references public.barbeiros(id) on delete cascade,

  ignorar       boolean not null default false,

  -- Quantas vezes esse nome já apareceu numa importação, e quando foi a
  -- última. Serve pra tela ordenar pelo que mais aparece — o nome que vem
  -- todo dia importa mais que o que veio uma vez.
  vezes         integer not null default 1,
  visto_em      timestamptz not null default now(),

  confirmado_por uuid references auth.users(id) on delete set null,
  confirmado_em  timestamptz,
  criado_em      timestamptz not null default now(),

  unique (barbearia_id, nome_origem)
);

comment on table public.import_agenda_depara is
  'De-para entre o nome do profissional no Agenda Serviço e o barbeiro do BarberMeta. Linha com barbeiro_id null e ignorar false está pendente de confirmação pelo dono.';
comment on column public.import_agenda_depara.nome_origem is
  'Nome do Agenda já normalizado (sem acento/caixa/espaço extra) — é a chave de busca da importação.';
comment on column public.import_agenda_depara.ignorar is
  'true = o dono disse que este nome não corresponde a ninguém e não deve mais ser perguntado.';

create index if not exists idx_import_depara_pendentes
  on public.import_agenda_depara(barbearia_id, visto_em desc)
  where barbeiro_id is null and ignorar = false;

-- ── RLS: só o dono da barbearia ───────────────────────────────────────────
alter table public.import_agenda_depara enable row level security;

drop policy if exists "dono_all_import_depara" on public.import_agenda_depara;
create policy "dono_all_import_depara" on public.import_agenda_depara
  for all
  using (barbearia_id = get_barbearia_id())
  with check (barbearia_id = get_barbearia_id());

-- O endpoint de importação roda com service_role (a extensão não tem sessão
-- de usuário), e service_role passa por cima da RLS — é ele que grava os
-- pendentes. A policy acima é o que protege a tela do dono.

-- ── Auto-conferência ──────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'import_agenda_depara'
  ) then
    raise exception '059: tabela import_agenda_depara não foi criada';
  end if;

  -- A unicidade por (barbearia, nome) é o que impede dois de-para
  -- contraditórios para o mesmo nome — com dois, a importação escolheria um
  -- deles ao acaso e o faturamento cairia no barbeiro errado.
  if not exists (
    select 1
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
     where t.relname = 'import_agenda_depara'
       and c.contype = 'u'
       and array_length(c.conkey, 1) = 2
  ) then
    raise exception '059: falta o unique (barbearia_id, nome_origem)';
  end if;

  if not exists (
    select 1 from pg_tables
    where schemaname = 'public' and tablename = 'import_agenda_depara' and rowsecurity
  ) then
    raise exception '059: RLS não está ligada em import_agenda_depara';
  end if;

  raise notice '059 ok: import_agenda_depara criada, chave única por nome, RLS ligada.';
end $$;
