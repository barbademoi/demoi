-- Bússola — AJUSTE F (Parte 1): universalização da empresa
-- Não destrutivo. Adiciona campos pra setor, tamanho e categorias customizadas.

alter table estabelecimentos
  add column if not exists setor text,
  add column if not exists tamanho_equipe text,
  add column if not exists categorias_customizadas text[]
    default array[
      'Desempenho técnico',
      'Atendimento',
      'Comportamento',
      'Cultura',
      'Pontualidade',
      'Resultados'
    ];

-- Empresas já existentes: garante o array default se ainda estiverem nulas.
update estabelecimentos
  set categorias_customizadas = array[
    'Desempenho técnico',
    'Atendimento',
    'Comportamento',
    'Cultura',
    'Pontualidade',
    'Resultados'
  ]
  where categorias_customizadas is null;
