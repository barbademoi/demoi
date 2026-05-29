-- Bússola — PROMPT G (Parte 1): feedback de cliente final + sorteio de brindes
-- Não destrutivo. Cria 2 tabelas novas e adiciona colunas a estabelecimentos.
--
-- NOTA: o prompt original usa nomes empresas/colaboradores/observacoes. Aqui
-- usamos os nomes internos reais (estabelecimentos/profissionais/feedbacks),
-- conforme decidido no AJUSTE F.

-- 1) Toggle e link público no estabelecimento.
alter table estabelecimentos
  add column if not exists feedback_cliente_ativo boolean default false,
  add column if not exists link_feedback_cliente_slug text unique,
  add column if not exists mensagem_pos_feedback text;

-- 2) Brindes (pool sorteável por empresa).
create table if not exists brindes (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
  nome text not null,
  descricao text,
  peso integer not null default 10 check (peso between 1 and 100),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_brindes_estab_ativo on brindes(estabelecimento_id) where ativo = true;

-- 3) Feedbacks de cliente final (estrelas + comentário + brinde sorteado).
create table if not exists feedbacks_cliente (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
  profissional_id uuid references profissionais(id) on delete set null,

  nome_cliente text,
  contato_cliente text,
  identificado boolean not null default false,

  estrelas integer not null check (estrelas between 1 and 5),
  comentario text,

  brinde_id uuid references brindes(id) on delete set null,
  codigo_resgate text unique,
  brinde_usado boolean not null default false,
  brinde_usado_em timestamptz,

  status text not null default 'novo'
    check (status in ('novo', 'lido', 'compartilhado_colaborador', 'arquivado')),
  feedback_gerado_id uuid references feedbacks(id) on delete set null,

  ip_address text,

  created_at timestamptz not null default now()
);
create index if not exists idx_fb_cliente_estab_data on feedbacks_cliente(estabelecimento_id, created_at desc);
create index if not exists idx_fb_cliente_novo on feedbacks_cliente(estabelecimento_id) where status = 'novo';
create index if not exists idx_fb_cliente_ip_data on feedbacks_cliente(ip_address, created_at);

-- 4) RLS — gestor só vê e mexe nos seus.
alter table brindes enable row level security;
create policy if not exists "gestor gerencia brindes"
  on brindes for all
  using (estabelecimento_id in (select id from estabelecimentos where dono_id = auth.uid()))
  with check (estabelecimento_id in (select id from estabelecimentos where dono_id = auth.uid()));

alter table feedbacks_cliente enable row level security;
create policy if not exists "gestor ve feedbacks de cliente da sua empresa"
  on feedbacks_cliente for all
  using (estabelecimento_id in (select id from estabelecimentos where dono_id = auth.uid()))
  with check (estabelecimento_id in (select id from estabelecimentos where dono_id = auth.uid()));
