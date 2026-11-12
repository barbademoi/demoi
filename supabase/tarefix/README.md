# Tarefix

Checklist diário de tarefas por colaborador. Produto **separado** que roda **dentro**
do BarberMeta:

- **Site:** mesmo projeto da Vercel, na rota `/tarefix` (colaborador em `/tarefix/c/[token]`).
- **Banco:** mesmo projeto Supabase, mas tudo no schema **`tarefix`** (nada no `public`,
  exceto a função marcadora `public.tarefix_instalado()`). Buckets `tarefix-provas` e
  `tarefix-midia`. Nenhuma tabela do BarberMeta é lida ou alterada.
- **Código:** `app/tarefix`, `components/tarefix`, `lib/tarefix`, `supabase/tarefix`.
  Estilos isolados em `app/tarefix/tarefix.css` (classes `tf-*`, cores `tf-*` no Tailwind).
- **Pontos de contato com o BarberMeta:** `middleware.ts` deixa `/tarefix` passar (o Tarefix
  cuida do próprio acesso); `MetaPixel` não dispara em `/tarefix`; `next.config.mjs` importa
  `.sql` como texto e manda `/tarefix` sem cache; `tailwind.config.ts` ganhou as cores `tf`.

## Etapas

- [x] **1. Supabase** — tabelas, RLS, buckets e instalação guiada em `/tarefix/instalar`
- [x] **2. Painel do dono** — login (`/tarefix/entrar`), funções, equipe (foto, link, PIN, WhatsApp, folgas, ativar/desativar), tarefas recorrentes (arrastar para ordenar) e avulsas, ajustes da empresa
- [ ] 3. Acesso do colaborador (token + PIN) e tela Hoje
- [ ] 4. Painel do dono: Hoje, reprovação, extras, avisos
- [ ] 5. Mês, histórico, bônus, fechamento, mensagens, comemoração
- [ ] 6. Tema claro/escuro, PWA e ícones

## Instalar (pelo navegador)

Depois do deploy, abra `https://www.barbermeta.com.br/tarefix/instalar` e siga a tela:

1. Conexão — usa as mesmas chaves do BarberMeta (já estão na Vercel).
2. **Copiar SQL** → colar no SQL Editor do Supabase → Run.
3. Supabase → Settings → Data API → **Exposed schemas** → adicionar `tarefix` → Save.
4. Criar a conta de dono (pode ser o mesmo e-mail do BarberMeta, com a mesma senha;
   a senha nunca é trocada). Só funciona enquanto não existe nenhum dono.

`/tarefix/status` mostra o diagnóstico completo.

## Decisões do banco

- Toda tabela tem `empresa_id`; RLS libera ao dono só a própria empresa (`tarefix.minha_empresa()`).
  Usuários do BarberMeta sem cadastro em `tarefix.donos` não veem nada.
- Colaborador **não** usa Supabase Auth: as rotas validam token + cookie do PIN e usam a
  service role. `anon` não tem nenhuma permissão no schema.
- `tarefas_dia` copia título/descrição/exige_foto do modelo (editar o modelo não muda o passado).
- Gatilhos: mês fechado trava `tarefas_dia`, `extras`, `folgas` e `tarefas_avulsas`; marcar
  folga apaga as tarefas daquele dia; reprovação exige motivo; colaborador/função sempre da
  mesma empresa.
- Campos além do briefing: `colaboradores.pin_tentativas`/`pin_bloqueado_ate`, `avisos.chave`
  (não duplicar o resumo diário) e `avisos.link`.
- Datas do dia sempre em `America/Sao_Paulo` (`lib/tarefix/datas.ts` e `tarefix.hoje_sp()`).
- Segredo do cookie do PIN: `TAREFIX_SESSION_SECRET` se existir; senão derivado da service role.
