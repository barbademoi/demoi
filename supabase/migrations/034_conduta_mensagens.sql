-- 034_conduta_mensagens.sql
-- Consolida o módulo de CONDUTA: observação + confirmação de leitura nas
-- ocorrências, e o CANAL DE MENSAGEM (barbeiro <-> dono) com anônimo e
-- read-receipts.
--
-- PRINCÍPIOS: nada aqui soma/subtrai em venda, meta ou ranking. RLS rígida por
-- barbearia; SÓ o dono tem policy nessas tabelas. O barbeiro acessa o que é
-- DELE via server (admin client) estritamente filtrado por barbeiro_id
-- resolvido do link_codigo secreto — nunca lê a conduta/mensagens de outro.
-- Fuso America/Sao_Paulo (as datas de ocorrência são 'date' BRT; timestamps
-- de leitura ficam em timestamptz).
--
-- Idempotente.

-- ── Ocorrências: observação (mostrada ao barbeiro) + ciência de leitura ──────
alter table public.ocorrencias_conduta
  add column if not exists observacao text;
alter table public.ocorrencias_conduta
  add column if not exists ciente_em timestamptz;   -- NULL = barbeiro ainda não deu ciência

comment on column public.ocorrencias_conduta.observacao is
  'Texto opcional do dono, exibido ao barbeiro junto da ocorrência.';
comment on column public.ocorrencias_conduta.ciente_em is
  'Quando o barbeiro clicou "Li e estou ciente". NULL = ainda não visto (fica em alerta).';

-- ── Canal de mensagem barbeiro <-> dono ─────────────────────────────────────
-- Cada linha é UMA mensagem. `autor` diz quem escreveu. `thread_id` agrupa a
-- conversa (id da 1a mensagem do barbeiro). `anonima` só vale pra mensagem do
-- barbeiro: quando true, o dono não vê o nome e NÃO pode responder (mão única),
-- mas o autor fica registrado internamente (barbeiro_id) por segurança.
-- `lida_em` = quando o DESTINATÁRIO leu (dono lê msg do barbeiro; barbeiro lê
-- a resposta do dono). NULL = não lida (fica em alerta pra quem recebeu).
create table if not exists public.mensagens_conduta (
  id            uuid default gen_random_uuid() primary key,
  barbearia_id  uuid not null references public.barbearias(id) on delete cascade,
  barbeiro_id   uuid not null references public.barbeiros(id) on delete cascade,
  thread_id     uuid not null,
  autor         text not null check (autor in ('barbeiro', 'dono')),
  anonima       boolean not null default false,
  corpo         text not null,
  lida_em       timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists idx_msg_conduta_barbearia on public.mensagens_conduta(barbearia_id, created_at desc);
create index if not exists idx_msg_conduta_barbeiro  on public.mensagens_conduta(barbeiro_id, created_at desc);
create index if not exists idx_msg_conduta_thread    on public.mensagens_conduta(thread_id, created_at);

-- ── RLS: SÓ O DONO (barbeiro acessa via server/admin, escopado por link) ─────
alter table public.mensagens_conduta enable row level security;

drop policy if exists "dono_all_mensagens_conduta" on public.mensagens_conduta;
create policy "dono_all_mensagens_conduta" on public.mensagens_conduta
  for all
  using (barbearia_id = get_barbearia_id())
  with check (barbearia_id = get_barbearia_id());
