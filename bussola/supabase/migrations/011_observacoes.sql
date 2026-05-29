-- Bússola — AJUSTE F (Parte 2): simplificação do modelo
-- DESTRUTIVO. Faça backup antes.
--
-- Remove tipo (positivo/negativo/observação) e estrelas — tudo vira observação.
-- Remove configs de visibilidade (não há mais carência pra negativo, já que
-- não há mais "negativo").
-- Adiciona momento_reuniao pra classificação da IA na hora da reunião.

alter table feedbacks
  drop column if exists tipo,
  drop column if exists estrelas,
  add column if not exists momento_reuniao text;

alter table estabelecimentos
  drop column if exists mostrar_negativos_profissional,
  drop column if exists mostrar_observacoes_profissional,
  drop column if exists atraso_negativo_minutos;

-- Observações antigas que estavam ocultas (negativo em carência ou bloqueado)
-- passam a ser visíveis a partir do momento original.
update feedbacks
  set visivel_profissional_em = created_at
  where visivel_profissional_em is null
    and deletado_em is null
    and escopo = 'individual';
