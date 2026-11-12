# Tarefix

Checklist diário de tarefas por colaborador. App **independente** (Next.js 14 +
Supabase próprio), separado do BarberMeta. Linguagem neutra: serve qualquer negócio.

## Etapas

- [x] **1. Supabase** — tabelas, RLS, buckets e instalação guiada em `/instalar`
- [ ] 2. Login do dono + CRUD de funções, colaboradores, tarefas e folgas
- [ ] 3. Acesso do colaborador (token + PIN) e tela Hoje
- [ ] 4. Painel do dono: Hoje, reprovação, extras, avisos
- [ ] 5. Mês, histórico, bônus, fechamento, mensagens, comemoração
- [ ] 6. Tema claro/escuro, PWA e ícones

## Instalar (tudo pelo navegador, sem terminal)

1. **Supabase** → crie um projeto novo (região São Paulo).
2. **Vercel** → Add New → Project → importe o repositório → **Root Directory = `tarefix`**.
   Em Environment Variables, cole as 3 chaves (Supabase → Project Settings → API):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Deploy.
3. Abra `https://SEU-APP.vercel.app/instalar` e siga a tela:
   - **Copiar SQL** → cola no SQL Editor do Supabase (o link já abre o seu projeto) → Run;
   - cria sua conta de dono e a empresa (o formulário só funciona enquanto não existe dono).
4. `/status` mostra o diagnóstico completo.

`TAREFIX_SESSION_SECRET` é opcional: sem ela, o segredo do cookie do PIN é derivado da service role.

### Rodar local (opcional, para desenvolvimento)

```bash
cd tarefix && cp .env.example .env.local && npm install && npm run dev   # http://localhost:3100
```

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
