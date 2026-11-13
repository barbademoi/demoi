-- 062_notificacoes_push.sql
-- NOTIFICAÇÕES PUSH: onde avisar, e o que já foi avisado.
--
-- Duas tabelas, com papéis bem separados:
--
--   push_inscricoes — PARA ONDE mandar. Uma linha por dispositivo que aceitou
--     receber. O mesmo dono pode ter celular e desktop; o mesmo celular pode
--     ser do dono numa aba e do barbeiro noutra.
--
--   push_enviadas — O QUE JÁ FOI MANDADO. É o que faz o lembrete PARAR quando
--     a tarefa é feita e, principalmente, o que impede o mesmo aviso de sair
--     duas vezes. O agendador roda de hora em hora e é burro de propósito:
--     ele reavalia tudo a cada vez, e é esta tabela que diz "esse já foi".
--
-- ── POR QUE O DESTINO É UM TEXTO, E NÃO DUAS FKs ───────────────────────────
-- O destinatário é um dono (auth.users) ou um barbeiro (barbeiros) — tabelas
-- diferentes. Com duas colunas anuláveis, o `unique` que impede a repetição
-- não funcionaria: no Postgres, NULL é distinto de NULL, então duas linhas
-- (null, 'x') seriam aceitas como diferentes e o aviso sairia duas vezes.
-- Com `destino text` ('dono:<uuid>' ou 'barbeiro:<uuid>') o unique é real.
-- As FKs continuam existindo em `push_inscricoes`, que é quem precisa delas
-- pra sumir junto com a conta.
--
-- ── O QUE NÃO ESTÁ AQUI ────────────────────────────────────────────────────
-- Preferência por tipo de aviso. Em v1 o interruptor é a própria inscrição:
-- aceitar liga tudo, desativar apaga a linha e para tudo. Uma tela de
-- preferências finas antes de existir um só aviso enviado seria inventar
-- opção pra problema que ninguém teve ainda.
--
-- Idempotente. Não altera nenhum dado existente.

-- ── 1. Para onde mandar ────────────────────────────────────────────────────
create table if not exists public.push_inscricoes (
  id            uuid primary key default gen_random_uuid(),
  barbearia_id  uuid not null references public.barbearias(id) on delete cascade,

  -- EXATAMENTE UM dos dois. O dono entra logado; o barbeiro entra pelo link
  -- com token e não tem conta no Auth, então ele é identificado pelo id dele.
  usuario_id    uuid references auth.users(id) on delete cascade,
  barbeiro_id   uuid references public.barbeiros(id) on delete cascade,

  -- O endereço que o navegador deu. É único no mundo: se a mesma pessoa
  -- reinstalar, o navegador emite outro e o antigo morre com 410.
  endpoint      text not null unique,
  p256dh        text not null,
  auth          text not null,

  user_agent    text,
  criado_em     timestamptz not null default now(),
  ultimo_envio  timestamptz,
  -- Entregas seguidas que falharam. Chegando ao teto, a linha é apagada:
  -- insistir num endereço morto só gasta tempo do cron.
  falhas        integer not null default 0,

  constraint push_inscricoes_um_destino
    check (num_nonnulls(usuario_id, barbeiro_id) = 1)
);

create index if not exists push_inscricoes_dono_idx
  on public.push_inscricoes (usuario_id) where usuario_id is not null;
create index if not exists push_inscricoes_barbeiro_idx
  on public.push_inscricoes (barbeiro_id) where barbeiro_id is not null;
create index if not exists push_inscricoes_barbearia_idx
  on public.push_inscricoes (barbearia_id);

comment on table public.push_inscricoes is
  'Dispositivos inscritos pra receber push. Uma linha por navegador/aparelho.';
comment on column public.push_inscricoes.endpoint is
  'Endereço do push service. Único no mundo — é a chave natural da inscrição.';
comment on column public.push_inscricoes.falhas is
  'Entregas seguidas que falharam. No teto, a inscrição é removida.';

-- ── 2. O que já foi mandado ────────────────────────────────────────────────
-- `marco` identifica UM envio por inteiro, incluindo a janela de tempo:
--   'lancamento-diario:2026-11-13:18'   (o lembrete das 18h daquele dia)
--   'metas-mes:2026-12:2026-11-27'      (a cobrança da meta, naquele dia)
--   'pontos-barbeiro:<id>:2026-11-13'   (o aviso de que fulano pontuou hoje)
-- O unique em (destino, marco) é o que garante "uma vez e só uma".
create table if not exists public.push_enviadas (
  id            uuid primary key default gen_random_uuid(),
  barbearia_id  uuid references public.barbearias(id) on delete cascade,
  destino       text not null,
  tipo          text not null,
  marco         text not null,
  enviada_em    timestamptz not null default now(),
  unique (destino, marco)
);

create index if not exists push_enviadas_limpeza_idx
  on public.push_enviadas (enviada_em);
create index if not exists push_enviadas_tipo_idx
  on public.push_enviadas (tipo, enviada_em desc);

comment on table public.push_enviadas is
  'Diário de bordo dos envios. O unique (destino, marco) é o que impede o '
  'mesmo aviso de sair duas vezes — o agendador reavalia tudo a cada hora.';
comment on column public.push_enviadas.marco is
  'Identifica o envio por inteiro, janela de tempo incluída. Ex.: '
  '''lancamento-diario:2026-11-13:18''.';

-- ── 3. RLS ─────────────────────────────────────────────────────────────────
-- Quem escreve e lê aqui é SEMPRE o servidor (server actions do app e o cron,
-- ambos com service_role, que ignora RLS). Nenhum cliente precisa tocar nestas
-- tabelas: a inscrição chega por server action, não por insert direto.
--
-- Com RLS ligada e nenhuma policy, a ausência de policy é a proibição — o
-- mesmo padrão de `financeiro_grants` (029) e `admin_concessoes_log` (061).
-- Importa mais aqui do que no resto: `endpoint`, `p256dh` e `auth` juntos
-- permitem MANDAR notificação pro aparelho de alguém.
alter table public.push_inscricoes enable row level security;
alter table public.push_enviadas  enable row level security;

-- ── 4. Faxina ──────────────────────────────────────────────────────────────
-- O diário cresce todo dia e não serve pra nada depois de passada a janela.
-- 60 dias cobrem com folga o maior ciclo (31 dias) mais o mês anterior.
create or replace function public.push_limpar_historico()
returns integer
language sql
security definer
set search_path = public
as $$
  with mortas as (
    delete from public.push_enviadas
    where enviada_em < now() - interval '60 days'
    returning 1
  )
  select count(*)::int from mortas;
$$;

comment on function public.push_limpar_historico() is
  'Apaga envios com mais de 60 dias. Chamada pelo cron das notificações.';

-- ── 5. Conferência ─────────────────────────────────────────────────────────
do $$
declare
  v_id uuid;
  v_dup boolean := false;
begin
  -- As duas tabelas existem com as colunas que o app escreve.
  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='push_inscricoes' and column_name='endpoint') then
    raise exception '062: push_inscricoes não foi criada direito';
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='push_enviadas' and column_name='marco') then
    raise exception '062: push_enviadas não foi criada direito';
  end if;

  -- O unique precisa REALMENTE impedir o aviso repetido. Testa de verdade.
  insert into public.push_enviadas (destino, tipo, marco)
    values ('teste:062', 'teste', 'conferencia-062') returning id into v_id;
  begin
    insert into public.push_enviadas (destino, tipo, marco)
      values ('teste:062', 'teste', 'conferencia-062');
    v_dup := true;
  exception when unique_violation then
    null;  -- é o esperado
  end;
  delete from public.push_enviadas where marco = 'conferencia-062';

  if v_dup then
    raise exception '062: o mesmo aviso pôde ser gravado duas vezes — o lembrete repetiria';
  end if;

  -- E a trava de "exatamente um destino" existe. Conferida pelo catálogo, e
  -- não com um insert de teste: um insert precisaria de uma barbearia real, e
  -- numa base vazia ele não falharia por motivo nenhum — a conferência diria
  -- que está tudo certo justamente onde não testou nada.
  if not exists (
    select 1 from pg_constraint where conname = 'push_inscricoes_um_destino'
  ) then
    raise exception '062: falta a trava que exige dono OU barbeiro na inscrição';
  end if;

  raise notice 'OK: push_inscricoes e push_enviadas criadas, com a trava contra aviso repetido.';
end $$;
