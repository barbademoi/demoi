-- Bússola — Ajuste B: dica de liderança por bloco da reunião
-- Rodar no SQL Editor do Supabase.

alter table sugestoes_ia drop constraint if exists sugestoes_ia_tipo_check;
alter table sugestoes_ia
  add constraint sugestoes_ia_tipo_check
  check (tipo in (
    'fala_reuniao',
    'categoria_feedback',
    'mensagem_whatsapp',
    'resumo_semana',
    'dica_bloco'
  ));

alter table sugestoes_ia add column if not exists bloco text;

-- Liga as dicas por padrão para estabelecimentos novos.
alter table estabelecimentos
  alter column config_ia set default '{
    "tom": "direto",
    "categorizacao_auto": true,
    "resumo_semana": true,
    "dicas_blocos": true
  }';
