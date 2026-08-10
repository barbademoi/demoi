-- 050_chat_assinantes.sql
-- CHAT INTERNO DOS ASSINANTES — duas naturezas bem separadas:
--
--   A) COMUNICADO (broadcast): UMA mensagem que eu publico e TODOS os
--      assinantes ativos veem. Não é conversa — ninguém responde um comunicado.
--      O texto pode ter marcadores ({nome_barbearia}, {falta_pra_meta}…) que
--      são trocados pelos dados DAQUELE assinante na hora de exibir.
--
--   B) SUPORTE: conversa 1-a-1 entre um assinante e o admin.
--
-- As duas moram em tabelas diferentes de propósito. Se comunicado e suporte
-- dividissem tabela, uma policy frouxa em uma natureza vazaria a outra, e
-- "todos veem" e "só o dono vê" são exatamente os dois extremos que não podem
-- se misturar.
--
-- ACESSO: tudo aqui exige `public.assinatura_ativa()` (migration 049).
-- Vitalício e não-assinante não enxergam o chat, e se a assinatura cair o
-- acesso cai junto — a policy é reavaliada a cada consulta, sem job nenhum.
--
-- O ADMIN não aparece nas policies: ele opera pelo service_role (as server
-- actions do painel), que ignora RLS. Assim não existe policy dizendo
-- "fulano pode ler tudo" que possa ser explorada com um e-mail parecido.
--
-- Idempotente.

-- ── 1. Configuração do chat (linha única) ─────────────────────────────────
-- O aviso de tempo de resposta é editável por mim e fica VISÍVEL pro assinante.
-- Existe pra alinhar expectativa: sem ele, "não respondeu em 10 minutos" vira
-- reclamação; com ele, o combinado está escrito na tela.
create table if not exists public.chat_config (
  id             boolean primary key default true check (id),
  aviso_resposta text not null default 'Respondo em até 1 dia útil, de segunda a sexta.',
  atualizado_em  timestamptz not null default now()
);

insert into public.chat_config (id) values (true) on conflict (id) do nothing;

-- ── 2. Comunicados (um → todos) ────────────────────────────────────────────
create table if not exists public.chat_comunicados (
  id            uuid primary key default uuid_generate_v4(),
  corpo         text not null check (length(btrim(corpo)) between 1 and 4000),
  publicado_em  timestamptz not null default now(),
  publicado_por uuid references auth.users(id) on delete set null,
  ativo         boolean not null default true
);

create index if not exists idx_chat_comunicados_data
  on public.chat_comunicados (publicado_em desc) where ativo;

-- Quem já leu qual comunicado — é o que alimenta o indicador de não lidas.
create table if not exists public.chat_comunicado_leituras (
  comunicado_id uuid not null references public.chat_comunicados(id) on delete cascade,
  usuario_id    uuid not null references auth.users(id) on delete cascade,
  lido_em       timestamptz not null default now(),
  primary key (comunicado_id, usuario_id)
);

-- ── 3. Suporte 1-a-1 ───────────────────────────────────────────────────────
-- `usuario_id` é sempre o ASSINANTE dono da conversa, inclusive nas mensagens
-- que EU escrevo. É ele que define de quem é a conversa; `autor` diz só quem
-- falou. Guardar o admin como "dono" de metade das linhas obrigaria a policy a
-- entender dois casos, e é aí que vaza.
create table if not exists public.chat_suporte (
  id         uuid primary key default uuid_generate_v4(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  autor      text not null check (autor in ('cliente', 'admin')),
  corpo      text not null check (length(btrim(corpo)) between 1 and 4000),
  criado_em  timestamptz not null default now(),
  -- Quando o OUTRO lado leu. null = não lida.
  lido_em    timestamptz
);

create index if not exists idx_chat_suporte_conversa
  on public.chat_suporte (usuario_id, criado_em);
create index if not exists idx_chat_suporte_nao_lidas
  on public.chat_suporte (usuario_id, autor) where lido_em is null;

-- ── 4. RLS ─────────────────────────────────────────────────────────────────
alter table public.chat_config             enable row level security;
alter table public.chat_comunicados        enable row level security;
alter table public.chat_comunicado_leituras enable row level security;
alter table public.chat_suporte            enable row level security;

-- CONFIG: qualquer assinante ativo lê o aviso; ninguém além do service_role escreve.
drop policy if exists "chat_config_leitura" on public.chat_config;
create policy "chat_config_leitura" on public.chat_config
  for select to authenticated
  using (public.assinatura_ativa());

-- COMUNICADOS: todo assinante ativo lê os publicados. Sem insert/update/delete
-- pra cliente — publicar é ato do admin, via service_role.
drop policy if exists "chat_comunicados_leitura" on public.chat_comunicados;
create policy "chat_comunicados_leitura" on public.chat_comunicados
  for select to authenticated
  using (ativo and public.assinatura_ativa());

-- LEITURAS: cada um marca as SUAS. `with check` prende usuario_id ao próprio
-- auth.uid(), senão daria pra marcar como lido no lugar de outro.
drop policy if exists "chat_leituras_proprias" on public.chat_comunicado_leituras;
create policy "chat_leituras_proprias" on public.chat_comunicado_leituras
  for select to authenticated
  using (usuario_id = auth.uid());

drop policy if exists "chat_leituras_marcar" on public.chat_comunicado_leituras;
create policy "chat_leituras_marcar" on public.chat_comunicado_leituras
  for insert to authenticated
  with check (usuario_id = auth.uid() and public.assinatura_ativa());

-- SUPORTE: a trava central. O assinante só enxerga as linhas da PRÓPRIA
-- conversa — as dele e as minhas respostas pra ele.
drop policy if exists "chat_suporte_propria_conversa" on public.chat_suporte;
create policy "chat_suporte_propria_conversa" on public.chat_suporte
  for select to authenticated
  using (usuario_id = auth.uid() and public.assinatura_ativa());

-- Ele só escreve COMO CLIENTE e SÓ na própria conversa. Sem o `autor =
-- 'cliente'` no with check, um cliente poderia inserir uma linha assinada como
-- admin e forjar uma resposta minha dentro da conversa dele.
drop policy if exists "chat_suporte_cliente_escreve" on public.chat_suporte;
create policy "chat_suporte_cliente_escreve" on public.chat_suporte
  for insert to authenticated
  with check (usuario_id = auth.uid() and autor = 'cliente' and public.assinatura_ativa());

-- Sem policy de UPDATE/DELETE de propósito: marcar como lido passa pela função
-- abaixo. Um update livre deixaria o cliente reescrever o `corpo` de mensagens
-- já enviadas — inclusive as minhas.

-- ── 5. Marcar como lido (o único caminho de UPDATE pro cliente) ────────────
create or replace function public.chat_marcar_lido()
returns void
language sql
volatile
security definer
set search_path = public, auth
as $$
  update public.chat_suporte
     set lido_em = now()
   where usuario_id = auth.uid()
     and autor = 'admin'
     and lido_em is null;
$$;

grant execute on function public.chat_marcar_lido() to authenticated;

comment on function public.chat_marcar_lido() is
  'Marca como lidas as respostas do admin na conversa do próprio usuário. '
  'Único UPDATE que o cliente alcança — a tabela não tem policy de update.';

-- ── 6. Contexto do assinante (o que preenche os marcadores) ───────────────
-- Devolve um jsonb com os números DAQUELA barbearia, no ciclo corrente dela.
--
-- O faturamento usa a MESMA precedência do painel do dono e do painel de
-- crescimento: `metas.faturamento_acumulado` quando preenchido, senão a soma
-- de `lancamentos.comissao_acumulada` dos barbeiros ATIVOS. Um comunicado que
-- cite um número diferente do que o dono vê na tela dele destrói a confiança
-- na mensagem inteira.
--
-- Campos que não existem pra aquela barbearia voltam null — quem exibe decide
-- o texto neutro. A função nunca inventa zero: zero é uma afirmação ("você não
-- faturou nada"), null é ausência de dado.
create or replace function public.chat_contexto_barbearia(p_barbearia_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, auth
as $$
  with hoje as (
    select (now() at time zone 'America/Sao_Paulo')::date as d
  ),
  -- Ciclo corrente da barbearia (mesma regra de cicloDeData no app): o mês de
  -- referência é o atual quando já passou o dia de fechamento, senão o anterior.
  ciclo as (
    select
      b.id, b.nome, b.dia_fechamento,
      case
        when extract(day from h.d) >= b.dia_fechamento
          then make_date(extract(year from h.d)::int, extract(month from h.d)::int, b.dia_fechamento)
        else (make_date(extract(year from h.d)::int, extract(month from h.d)::int, b.dia_fechamento) - interval '1 month')::date
      end as ref_ini,
      h.d as hoje
    from public.barbearias b, hoje h
    where b.id = p_barbearia_id
  ),
  ref as (
    select c.*,
           extract(month from c.ref_ini)::int as ref_mes,
           extract(year  from c.ref_ini)::int as ref_ano,
           (c.ref_ini + interval '1 month')::date as prox_fech
      from ciclo c
  ),
  -- Faturamento de TODAS as barbearias no ciclo corrente de cada uma — é o que
  -- permite dizer a posição no ranking. São poucas centenas de linhas.
  todas as (
    select
      b.id,
      coalesce(
        nullif((select m.faturamento_acumulado
                  from public.metas m
                 where m.barbearia_id = b.id
                   and m.mes = extract(month from cb.ref_ini)::int
                   and m.ano = extract(year  from cb.ref_ini)::int), 0),
        (select coalesce(sum(l.comissao_acumulada), 0)
           from public.lancamentos l
           join public.barbeiros bb on bb.id = l.barbeiro_id and bb.ativo = true
          where l.barbearia_id = b.id
            and l.mes = extract(month from cb.ref_ini)::int
            and l.ano = extract(year  from cb.ref_ini)::int),
        0
      )::numeric as valor
    from public.barbearias b
    cross join lateral (
      select case
               when extract(day from h.d) >= b.dia_fechamento
                 then make_date(extract(year from h.d)::int, extract(month from h.d)::int, b.dia_fechamento)
               else (make_date(extract(year from h.d)::int, extract(month from h.d)::int, b.dia_fechamento) - interval '1 month')::date
             end as ref_ini
        from hoje h
    ) cb
  ),
  posicao as (
    select
      (select count(*) + 1 from todas t2
        where t2.valor > (select valor from todas where id = p_barbearia_id))::int as pos,
      (select count(*) from todas where valor > 0)::int                            as total
  ),
  dados as (
    select
      r.nome,
      r.hoje,
      r.prox_fech,
      (select nullif(m.meta_coletiva, 0)
         from public.metas m
        where m.barbearia_id = p_barbearia_id
          and m.mes = r.ref_mes and m.ano = r.ref_ano)                as meta,
      (select valor from todas where id = p_barbearia_id)             as faturamento,
      (select count(*) from public.barbeiros b
        where b.barbearia_id = p_barbearia_id and b.ativo = true)::int as qtd_barbeiros,
      (select b.nome
         from public.lancamentos l
         join public.barbeiros b on b.id = l.barbeiro_id and b.ativo = true
        where l.barbearia_id = p_barbearia_id
          and l.mes = r.ref_mes and l.ano = r.ref_ano
          and coalesce(l.comissao_acumulada, 0) > 0
        order by l.comissao_acumulada desc
        limit 1)                                                       as top_barbeiro
    from ref r
  )
  select jsonb_build_object(
    'nome_barbearia',   d.nome,
    'faturamento_mes',  nullif(d.faturamento, 0),
    'meta_mes',         d.meta,
    -- Só faz sentido falar em "falta" quando existe meta. Sem meta, null —
    -- e quem exibe omite a frase em vez de dizer "falta R$ 0,00".
    'falta_pra_meta',   case when d.meta is null then null
                             else greatest(0, d.meta - coalesce(d.faturamento, 0)) end,
    'posicao_ranking',  case when coalesce(d.faturamento, 0) > 0 then p.pos else null end,
    'total_ranking',    nullif(p.total, 0),
    'qtd_barbeiros',    nullif(d.qtd_barbeiros, 0),
    'top_barbeiro',     d.top_barbeiro,
    'dias_para_fechar', greatest(0, (d.prox_fech - d.hoje))::int
  )
  from dados d, posicao p;
$$;

grant execute on function public.chat_contexto_barbearia(uuid) to authenticated, service_role;

comment on function public.chat_contexto_barbearia(uuid) is
  'Dados da barbearia no ciclo corrente pra preencher os marcadores dos '
  'comunicados. Faturamento com a mesma precedência do painel do dono. '
  'Campo sem dado volta null — nunca zero inventado.';

-- ── 7. Conferência ─────────────────────────────────────────────────────────
do $$
declare
  v_pol int;
begin
  -- Nenhuma policy pode existir sem amarrar a linha ao próprio usuário: é o
  -- que impede um assinante de ler a conversa do vizinho.
  select count(*) into v_pol
    from pg_policies
   where schemaname = 'public' and tablename = 'chat_suporte'
     and qual is not null and qual not like '%auth.uid()%';
  if v_pol > 0 then
    raise exception 'Existe policy em chat_suporte sem amarrar a auth.uid().';
  end if;

  -- Update livre pro cliente reescreveria mensagem já enviada.
  if exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'chat_suporte'
       and cmd in ('UPDATE', 'DELETE')
  ) then
    raise exception 'chat_suporte não pode ter policy de UPDATE/DELETE pra cliente.';
  end if;

  raise notice 'OK: chat criado com RLS por dono e sem update de cliente.';
end $$;
