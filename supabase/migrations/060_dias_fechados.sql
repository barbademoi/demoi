-- 060_dias_fechados.sql
-- CALENDÁRIO DE OPERAÇÃO: as exceções do mês.
--
-- POR QUE EXISTE
-- O painel vinha acusando "5 dias sem registro neste ciclo" em datas que a
-- barbearia estava fechada — os 4 domingos e o feriado de 12/10. Dia fechado
-- não é lacuna de lançamento; é folga.
--
-- Duas das três fontes já existiam:
--   - dia da semana → `barbearias.dias_trabalhados` (jsonb, já preenchido
--     pelo dono em Configurações → Operação);
--   - feriado nacional → calculado no app (lib/feriados), sem rede.
-- Faltava a terceira: as datas específicas que o dono decide fechar (ou abrir)
-- naquele mês. É só isso que esta migration acrescenta.
--
-- FORMATO
-- Duas listas de datas 'YYYY-MM-DD' em jsonb, na própria `barbearias`:
--   dias_fechados — fecha um dia que o calendário abriria;
--   dias_abertos  — abre um dia que o calendário fecharia (feriado em que a
--                   barbearia trabalha). Sem esta, quem abre na Sexta-feira
--                   Santa seria marcado como fechado contra a própria vontade.
--
-- Sem tabela nova de propósito: são poucas datas por barbearia, lidas sempre
-- junto com o resto da configuração, e a RLS de `barbearias` já cobre tudo.
--
-- Idempotente. Não altera nenhum dado existente: o default é lista vazia, que
-- significa exatamente o comportamento de hoje.

alter table public.barbearias
  add column if not exists dias_fechados jsonb not null default '[]'::jsonb;

alter table public.barbearias
  add column if not exists dias_abertos jsonb not null default '[]'::jsonb;

comment on column public.barbearias.dias_fechados is
  'Datas YYYY-MM-DD em que a barbearia NÃO abre, marcadas à mão pelo dono. '
  'Vence o dia da semana e o feriado.';

comment on column public.barbearias.dias_abertos is
  'Datas YYYY-MM-DD em que a barbearia abre APESAR de feriado ou de o dia da '
  'semana estar desmarcado. Vence tudo.';

-- Guarda de formato: tem que ser um ARRAY json, não objeto nem string. Uma
-- gravação errada aqui faria o calendário inteiro se comportar de forma
-- imprevisível, e o erro só apareceria na tela do dono.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'barbearias_dias_fechados_array'
  ) then
    alter table public.barbearias
      add constraint barbearias_dias_fechados_array
      check (jsonb_typeof(dias_fechados) = 'array');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'barbearias_dias_abertos_array'
  ) then
    alter table public.barbearias
      add constraint barbearias_dias_abertos_array
      check (jsonb_typeof(dias_abertos) = 'array');
  end if;
end $$;

-- ── Verificação ────────────────────────────────────────────────────────────
do $$
declare
  v_fechados int;
  v_abertos  int;
begin
  select count(*) into v_fechados
    from information_schema.columns
   where table_schema = 'public' and table_name = 'barbearias' and column_name = 'dias_fechados';
  select count(*) into v_abertos
    from information_schema.columns
   where table_schema = 'public' and table_name = 'barbearias' and column_name = 'dias_abertos';

  if v_fechados <> 1 or v_abertos <> 1 then
    raise exception 'As colunas do calendário não foram criadas (fechados=%, abertos=%)', v_fechados, v_abertos;
  end if;

  -- Nenhuma barbearia pode ter ficado com NULL: o default protege as linhas
  -- existentes, e NULL aqui quebraria a leitura no app.
  if exists (select 1 from public.barbearias where dias_fechados is null or dias_abertos is null) then
    raise exception 'Há barbearia com calendário NULL — o default não foi aplicado';
  end if;

  raise notice 'OK: calendário de operação criado e aplicado a todas as barbearias.';
end $$;
