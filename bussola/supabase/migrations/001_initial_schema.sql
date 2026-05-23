-- Bússola — schema inicial (Prompt 1)
-- Rodar no SQL Editor do Supabase (ou via CLI).

-- TABELA: estabelecimentos
create table estabelecimentos (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid references auth.users(id) on delete cascade,
  nome text not null,
  endereco text,
  valores_cultura text[],
  dia_reuniao integer default 1,
  hora_reuniao time default '09:00',
  plano text default 'basico',
  created_at timestamptz default now()
);

-- TABELA: profissionais
create table profissionais (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid references estabelecimentos(id) on delete cascade,
  slug text unique not null,
  nome text not null,
  foto_url text,
  funcao text,
  data_entrada date,
  status text default 'ativo',
  motivadores text[],
  estilo_comunicacao text,
  pontos_fortes text,
  pontos_desenvolvimento text,
  notas_livres text,
  competencias jsonb default '{}',
  created_at timestamptz default now()
);

-- TABELA: feedbacks
create table feedbacks (
  id uuid primary key default gen_random_uuid(),
  profissional_id uuid references profissionais(id) on delete cascade,
  estabelecimento_id uuid references estabelecimentos(id) on delete cascade,
  tipo text not null check (tipo in ('positivo','negativo','observacao')),
  categoria text,
  texto text not null,
  audio_url text,
  estrelas integer check (estrelas between 1 and 5),
  status text default 'pendente',
  sugestao_ia text,
  created_at timestamptz default now()
);

-- TABELA: reunioes
create table reunioes (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid references estabelecimentos(id) on delete cascade,
  data_reuniao timestamptz not null,
  duracao_minutos integer,
  pauta jsonb,
  anotacoes text,
  metas jsonb,
  status text default 'planejada',
  created_at timestamptz default now()
);

-- TABELA: metas_semanais
create table metas_semanais (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid references estabelecimentos(id) on delete cascade,
  reuniao_id uuid references reunioes(id) on delete set null,
  texto text not null,
  responsavel_id uuid references profissionais(id) on delete set null,
  semana_referencia date not null,
  status text default 'ativa',
  created_at timestamptz default now()
);

-- RLS BÁSICO
alter table estabelecimentos enable row level security;
alter table profissionais enable row level security;
alter table feedbacks enable row level security;
alter table reunioes enable row level security;
alter table metas_semanais enable row level security;

-- Dono só vê o próprio estabelecimento
create policy "dono ve seu estabelecimento"
  on estabelecimentos for all
  using (auth.uid() = dono_id);

create policy "dono ve seus profissionais"
  on profissionais for all
  using (estabelecimento_id in (
    select id from estabelecimentos where dono_id = auth.uid()
  ));

create policy "dono ve seus feedbacks"
  on feedbacks for all
  using (estabelecimento_id in (
    select id from estabelecimentos where dono_id = auth.uid()
  ));

create policy "dono ve suas reunioes"
  on reunioes for all
  using (estabelecimento_id in (
    select id from estabelecimentos where dono_id = auth.uid()
  ));

create policy "dono ve suas metas"
  on metas_semanais for all
  using (estabelecimento_id in (
    select id from estabelecimentos where dono_id = auth.uid()
  ));
