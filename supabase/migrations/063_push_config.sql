-- 063_push_config.sql
-- AS CHAVES E O AGENDAMENTO DAS NOTIFICAÇÕES, DENTRO DO BANCO.
--
-- A 062 criou ONDE avisar (push_inscricoes) e O QUE JÁ FOI AVISADO
-- (push_enviadas). Faltava o terceiro pedaço, que até agora morava fora do
-- banco e por isso dependia de duas configurações manuais:
--
--   1. as chaves VAPID, que estavam em variáveis de ambiente na Vercel;
--   2. o segredo do agendador, que estava num secret do GitHub Actions.
--
-- Agora os dois moram aqui, no mesmo molde que o Tarefix já usa neste projeto
-- (supabase/tarefix/008_push.sql). O ganho não é de arquitetura, é de operação:
-- não há mais nada pra colar na Vercel, nada pra criar no GitHub, e nenhum
-- deploy pra lembrar de fazer depois. Roda esta migration e o sistema está de
-- pé.
--
-- ── POR QUE O SERVIDOR GERA A CHAVE SOZINHO ─────────────────────────────────
-- A chave VAPID não é um segredo compartilhado com ninguém: é um par que o
-- próprio servidor cria pra assinar o que manda. Não existe valor "certo" que
-- precise vir de fora — só precisa ser o MESMO em todo envio, senão as
-- inscrições feitas com a chave antiga param de receber. Guardar no banco
-- garante isso melhor que uma variável de ambiente, que alguém pode trocar num
-- redeploy sem perceber.
--
-- O servidor cria na primeira vez que precisar (lib/push/config.ts) e grava
-- aqui. Da segunda vez em diante, lê.
--
-- ── O SEGREDO DO AGENDADOR ──────────────────────────────────────────────────
-- `segredo_cron` nasce aleatório no default desta tabela — ninguém digita, e
-- ele nunca sai do banco a não ser no cabeçalho que o pg_cron manda. A rota
-- compara em tempo constante.
--
-- Idempotente. Não altera nenhum dado existente.

-- ── 1. A linha única ───────────────────────────────────────────────────────
create table if not exists public.push_config (
  id             int primary key default 1 check (id = 1),
  vapid_publico  text,
  vapid_privado  text,
  -- Dois uuids sem hífen: 64 caracteres de entropia, gerados pelo banco.
  segredo_cron   text not null default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz
);

insert into public.push_config (id) values (1) on conflict (id) do nothing;

comment on table public.push_config is
  'Linha única: chaves VAPID (criadas pelo servidor na primeira vez) e o '
  'segredo que o agendador usa pra chamar /api/cron/notificacoes.';
comment on column public.push_config.vapid_privado is
  'Chave privada do VAPID. Só a service_role lê. Trocar invalida todas as '
  'inscrições já feitas.';
comment on column public.push_config.segredo_cron is
  'Segredo do agendador. Sai do banco só no cabeçalho x-barbermeta-cron.';

-- ── 2. Ninguém além do servidor ────────────────────────────────────────────
-- Mesmo padrão das tabelas da 062: RLS ligada e nenhuma policy, então a
-- ausência de policy é a proibição. Aqui o revoke importa ainda mais — esta
-- tabela guarda a chave privada e o segredo do agendador.
alter table public.push_config enable row level security;
revoke all on public.push_config from anon, authenticated;
grant all on public.push_config to service_role;

-- ── 3. As extensões do agendador ───────────────────────────────────────────
-- pg_net faz a chamada HTTP; pg_cron dispara na hora marcada. Já estão neste
-- projeto por causa do Tarefix, mas a criação é idempotente e barata.
-- Se a conta não puder criar extensão, isto avisa em vez de derrubar a
-- migration: as tabelas acima são o que importa, e o agendamento pode ser
-- criado depois pelo painel (Database → Extensions) e rodando isto de novo.
do $fora$
begin
  execute 'create extension if not exists pg_net';
  execute 'create extension if not exists pg_cron';
exception when others then
  raise notice '063: não deu pra criar pg_net/pg_cron (%). Ative em Database → Extensions e rode esta migration de novo.', sqlerrm;
end
$fora$;

-- ── 4. O agendamento ───────────────────────────────────────────────────────
-- Horas em UTC. São Paulo é UTC−3 o ano todo (não há horário de verão desde
-- 2019), então 13h UTC = 10h daqui.
--
--   13 → 10h  oferecer serviço extra, e o comparativo na segunda
--   20 → 17h  resumo: pontos que faltam, comissão, cobrança de meta
--   21..02 → 18h às 23h  lembrete de lançar, de hora em hora
--   06 → 03h  faxina do histórico de envios
--
-- Uma linha só, com a lista de horas: nove agendamentos separados seriam nove
-- lugares pra errar.
--
-- O segredo é lido DENTRO do job, a cada disparo. Assim, trocar o segredo na
-- tabela não exige reagendar nada.
do $fora$
begin
  if to_regclass('cron.job') is null then
    raise notice '063: pg_cron não está instalado — as tabelas foram criadas, mas o agendamento não.';
    return;
  end if;

  -- Reagendar é apagar e criar: rodar esta migration duas vezes não deixa dois
  -- jobs mandando o mesmo aviso.
  if exists (select 1 from cron.job where jobname = 'barbermeta-notificacoes') then
    perform cron.unschedule('barbermeta-notificacoes');
  end if;

  perform cron.schedule(
    'barbermeta-notificacoes',
    '5 13,20,21,22,23,0,1,2,6 * * *',
    $job$
      select net.http_get(
        url := 'https://www.barbermeta.com.br/api/cron/notificacoes',
        headers := jsonb_build_object(
          'x-barbermeta-cron', (select segredo_cron from public.push_config where id = 1)
        ),
        timeout_milliseconds := 55000
      );
    $job$
  );

  raise notice 'OK: agendamento barbermeta-notificacoes criado (9 horários por dia).';
exception when others then
  raise notice '063: não deu pra agendar (%). As tabelas estão criadas; o agendamento pode ser feito depois.', sqlerrm;
end
$fora$;

-- ── 5. Conferência ─────────────────────────────────────────────────────────
do $fora$
declare
  v_segredo text;
begin
  select segredo_cron into v_segredo from public.push_config where id = 1;

  if v_segredo is null or length(v_segredo) < 32 then
    raise exception '063: push_config não tem um segredo de agendador utilizável';
  end if;

  -- A tabela não pode ser legível por quem não é o servidor. Se o grant
  -- estivesse errado, a chave privada vazaria pro cliente anônimo.
  if has_table_privilege('anon', 'public.push_config', 'select') then
    raise exception '063: anon ainda consegue ler push_config — a chave privada ficaria exposta';
  end if;
  if has_table_privilege('authenticated', 'public.push_config', 'select') then
    raise exception '063: authenticated ainda consegue ler push_config';
  end if;

  raise notice 'OK: push_config criada, fechada pro cliente, com segredo de % caracteres.', length(v_segredo);
end
$fora$;
