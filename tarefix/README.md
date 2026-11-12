# Tarefix

Checklist diário de tarefas por colaborador. App **independente** (Next.js 14 +
Supabase próprio), separado do BarberMeta. Linguagem neutra: serve qualquer negócio.

## Etapas

- [x] **1. Supabase** — tabelas, RLS, buckets, seed
- [ ] 2. Login do dono + CRUD de funções, colaboradores, tarefas e folgas
- [ ] 3. Acesso do colaborador (token + PIN) e tela Hoje
- [ ] 4. Painel do dono: Hoje, reprovação, extras, avisos
- [ ] 5. Mês, histórico, bônus, fechamento, mensagens, comemoração
- [ ] 6. Tema claro/escuro, PWA e ícones

## Configurar o Supabase (uma vez)

1. Crie um projeto **novo** em supabase.com (região São Paulo).
2. SQL Editor → rode, nesta ordem:
   - `supabase/migrations/001_estrutura.sql`
   - `supabase/migrations/002_rls.sql`
   - `supabase/migrations/003_storage.sql`
3. Authentication → Users → **Add user** → crie seu usuário (e-mail + senha, *Auto Confirm*).
4. Abra `supabase/seed.sql`, troque e-mail e nome no topo e rode no SQL Editor.
5. Authentication → Providers → Email: desative "Allow new users to sign up"
   (na V1 só o dono cadastrado entra).

## Rodar local

```bash
cd tarefix
cp .env.example .env.local   # preencha com as chaves do projeto (Settings → API)
npm install
npm run dev                  # http://localhost:3100
```

Abra `http://localhost:3100/status`: todas as linhas devem estar com ✓.

## Deploy (Vercel)

Novo projeto na Vercel apontando para este repositório com **Root Directory = `tarefix`**,
e as mesmas 4 variáveis do `.env.example`.

## Decisões do banco

- Toda tabela tem `empresa_id`; RLS libera ao dono só a própria empresa (`minha_empresa()`).
- Colaborador **não** usa Supabase Auth: as API routes validam token + cookie do PIN e usam a
  service role. Não existe policy para `anon`.
- `tarefas_dia` copia título/descrição/exige_foto do modelo (editar o modelo não muda o passado).
- Gatilhos no banco: mês fechado trava `tarefas_dia`, `extras`, `folgas` e `tarefas_avulsas`;
  marcar folga apaga as tarefas daquele dia; reprovação exige motivo; colaborador/função
  sempre da mesma empresa.
- Campos além do briefing: `colaboradores.pin_tentativas`/`pin_bloqueado_ate` (bloqueio de
  5 min), `avisos.chave` (não duplicar o resumo diário) e `avisos.link`.
- Buckets: `provas` (privado, `empresa/colaborador/data/arquivo`) e `midia` (público, logo e
  fotos de perfil).
- Datas do dia sempre em `America/Sao_Paulo` (`src/lib/datas.ts` e `hoje_sp()` no banco).
