-- 053_brindoleta_resumo_valor.sql
-- Acrescenta ao resumo do barbeiro o VALOR que ele já gerou com a Brindoleta.
--
-- Só entram as vendas CONFIRMADAS pelo dono. O `amount_cents` nasce zerado
-- (a oferta não define preço — o prêmio pode ser algo que o cliente escolhe) e
-- só recebe valor quando o dono confere a venda e digita quanto foi. Somar
-- pendente seria mostrar ao barbeiro um dinheiro que ainda não existe, e no dia
-- em que o dono recusasse a venda o número cairia sozinho — pior do que não
-- mostrar nada.
--
-- A função é recriada (drop + create) porque mudar as colunas de retorno de uma
-- função `returns table` não é possível com create or replace.
--
-- Idempotente.

drop function if exists public.brindoleta_resumo_barbeiro(text);

create function public.brindoleta_resumo_barbeiro(p_link_codigo text)
returns table (
  liberada               boolean,
  giros                  integer,
  resgates               integer,
  confirmadas            integer,
  pendentes              integer,
  recusadas              integer,
  valor_confirmado_cents bigint,
  ciclo_inicio           date,
  ciclo_fim              date
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
  -- Ciclo corrente da barbearia, mesma regra de cicloDeData no app.
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
    (select count(*) from public.brindoleta_spins s
      where s.barbeiro_id = j.barbeiro_id
        and (s.created_at at time zone 'America/Sao_Paulo')::date between j.ini and j.fim
    )::int as giros,
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
    -- SÓ confirmadas. Ver o comentário do topo.
    (select coalesce(sum(v.amount_cents), 0) from public.brindoleta_sales v
      where v.barbeiro_id = j.barbeiro_id and v.status = 'confirmed'
        and (v.created_at at time zone 'America/Sao_Paulo')::date between j.ini and j.fim
    )::bigint as valor_confirmado_cents,
    j.ini as ciclo_inicio,
    j.fim as ciclo_fim
  from janela j;
$$;

revoke all on function public.brindoleta_resumo_barbeiro(text) from public;
grant execute on function public.brindoleta_resumo_barbeiro(text) to service_role;

comment on function public.brindoleta_resumo_barbeiro(text) is
  'Giros, resgates e valor CONFIRMADO da Brindoleta do barbeiro dono do '
  'link_codigo, no ciclo corrente. O escopo é resolvido pelo código: não existe '
  'parâmetro de barbeiro, então não há como pedir o número de outro.';

-- ── Conferência ────────────────────────────────────────────────────────────
do $$
begin
  -- Continua sendo um argumento só: é essa ausência que impede pedir o dado
  -- do colega.
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

  raise notice 'OK: resumo do barbeiro agora traz o valor confirmado.';
end $$;
