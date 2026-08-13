-- 052_brindoleta_resumo_barbeiro.sql
-- CONFERÊNCIA DA BRINDOLETA PELO BARBEIRO — só os números DELE.
--
-- A página /b/[codigo] é pública: o barbeiro não tem conta no Supabase, ele é
-- identificado pelo `link_codigo` secreto. Não existe `auth.uid()` ali, então
-- não dá pra escrever uma policy por dono como nas outras tabelas.
--
-- O escopo então mora AQUI, e não no app: a função recebe o CÓDIGO e resolve
-- sozinha de qual barbeiro se trata. O app nunca escolhe um `barbeiro_id` — não
-- há parâmetro pra isso. É o que impede um erro de digitação (ou um refactor
-- distraído) de mostrar o número do colega, e é uma garantia mais forte do que
-- filtrar no TypeScript, porque nem existe caminho para pedir outro barbeiro.
--
-- Fonte única: conta as MESMAS linhas que a Brindoleta grava — brindoleta_spins
-- e brindoleta_sales. Nada é recalculado nem estimado; se o painel do dono e a
-- tela do barbeiro discordassem, o barbeiro deixaria de confiar nos dois.
--
-- Idempotente.

create or replace function public.brindoleta_resumo_barbeiro(p_link_codigo text)
returns table (
  liberada      boolean,
  giros         integer,
  resgates      integer,
  confirmadas   integer,
  pendentes     integer,
  recusadas     integer,
  ciclo_inicio  date,
  ciclo_fim     date
)
language sql
stable
security definer
set search_path = public, auth
as $$
  with alvo as (
    select b.id as barbeiro_id, b.barbearia_id, coalesce(ba.dia_fechamento, 1) as dia_fech
      from public.barbeiros b
      join public.barbearias ba on ba.id = b.barbearia_id
     where b.link_codigo = p_link_codigo
       and b.ativo = true
  ),
  hoje as (
    select (now() at time zone 'America/Sao_Paulo')::date as d
  ),
  -- Ciclo corrente da barbearia, mesma regra de cicloDeData no app: o mês de
  -- referência é o atual quando já passou o dia de fechamento, senão o anterior.
  ciclo as (
    select
      a.*,
      case
        when extract(day from h.d) >= a.dia_fech
          then make_date(extract(year from h.d)::int, extract(month from h.d)::int, a.dia_fech)
        else (make_date(extract(year from h.d)::int, extract(month from h.d)::int, a.dia_fech) - interval '1 month')::date
      end as ini
      from alvo a, hoje h
  ),
  janela as (
    select c.*, (c.ini + interval '1 month' - interval '1 day')::date as fim
      from ciclo c
  )
  select
    public.brindoleta_liberada(j.barbearia_id) as liberada,
    -- Giros: uma linha por giro registrado com ESTE barbeiro.
    (select count(*) from public.brindoleta_spins s
      where s.barbeiro_id = j.barbeiro_id
        and (s.created_at at time zone 'America/Sao_Paulo')::date between j.ini and j.fim
    )::int as giros,
    -- Resgates: o cliente aceitou a oferta e deixou o nome. É a "venda" do
    -- ponto de vista do barbeiro — o dono ainda confirma depois.
    (select count(*) from public.brindoleta_sales v
      where v.barbeiro_id = j.barbeiro_id
        and (v.created_at at time zone 'America/Sao_Paulo')::date between j.ini and j.fim
    )::int as resgates,
    (select count(*) from public.brindoleta_sales v
      where v.barbeiro_id = j.barbeiro_id and v.status = 'confirmed'
        and (v.created_at at time zone 'America/Sao_Paulo')::date between j.ini and j.fim
    )::int as confirmadas,
    (select count(*) from public.brindoleta_sales v
      where v.barbeiro_id = j.barbeiro_id and v.status = 'pending'
        and (v.created_at at time zone 'America/Sao_Paulo')::date between j.ini and j.fim
    )::int as pendentes,
    (select count(*) from public.brindoleta_sales v
      where v.barbeiro_id = j.barbeiro_id and v.status = 'rejected'
        and (v.created_at at time zone 'America/Sao_Paulo')::date between j.ini and j.fim
    )::int as recusadas,
    j.ini as ciclo_inicio,
    j.fim as ciclo_fim
  from janela j;
$$;

-- Só o service_role executa: quem chama é a página do barbeiro, no servidor.
-- Deixar `anon` executar transformaria o resumo num endereço público sujeito a
-- tentativa de adivinhação de código, sem nenhum ganho — a página já é servida
-- pelo servidor.
revoke all on function public.brindoleta_resumo_barbeiro(text) from public;
grant execute on function public.brindoleta_resumo_barbeiro(text) to service_role;

comment on function public.brindoleta_resumo_barbeiro(text) is
  'Giros e resgates da Brindoleta do barbeiro dono do link_codigo, no ciclo '
  'corrente da barbearia. O escopo é resolvido pelo código: não existe '
  'parâmetro de barbeiro, então não há como pedir o número de outro.';

-- ── Conferência ────────────────────────────────────────────────────────────
do $$
begin
  -- A função não pode aceitar um id de barbeiro: é essa ausência que garante
  -- que ninguém peça o dado do colega. Um argumento só, e do tipo text.
  if not exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'brindoleta_resumo_barbeiro'
       and p.pronargs = 1
       and p.proargtypes[0] = 'text'::regtype
  ) then
    raise exception 'brindoleta_resumo_barbeiro deve receber SOMENTE o link_codigo (um argumento text).';
  end if;

  raise notice 'OK: resumo da Brindoleta escopado pelo link_codigo do barbeiro.';
end $$;
