-- Bússola — IA: cache de sugestões + configurações (Prompt 6)
-- Rodar no SQL Editor do Supabase.

create table if not exists sugestoes_ia (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in (
    'fala_reuniao',
    'categoria_feedback',
    'mensagem_whatsapp',
    'resumo_semana'
  )),
  feedback_id uuid references feedbacks(id) on delete cascade,
  estabelecimento_id uuid references estabelecimentos(id) on delete cascade,
  conteudo text not null,
  prompt_tokens integer,
  completion_tokens integer,
  modelo text,
  created_at timestamptz default now()
);

create index if not exists idx_sugestoes_feedback on sugestoes_ia(feedback_id, tipo);
create index if not exists idx_sugestoes_estab on sugestoes_ia(estabelecimento_id, tipo, created_at desc);

alter table sugestoes_ia enable row level security;

drop policy if exists "dono ve suas sugestoes" on sugestoes_ia;
create policy "dono ve suas sugestoes"
  on sugestoes_ia for all
  using (estabelecimento_id in (
    select id from estabelecimentos where dono_id = auth.uid()
  ));

-- Configurações de IA por estabelecimento.
alter table estabelecimentos
  add column if not exists config_ia jsonb default '{
    "tom": "direto",
    "categorizacao_auto": true,
    "resumo_semana": true
  }';
