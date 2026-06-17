# Controle Financeiro — app standalone

Versão **independente** do módulo Controle Financeiro do BarberMeta: roda como
seu próprio app Next.js, com login/cadastro próprios, página de oferta e cadeado
liberado por compra na Hotmart. Pode ser vendido sozinho, sem o BarberMeta.

> O app embutido no BarberMeta continua existindo em `../components/financeiro`
> e `../app/dashboard/financeiro`. Este aqui é o produto separado.

## Backend compartilhado

Usa o **mesmo projeto Supabase do BarberMeta**. Ou seja:

- As tabelas `financeiro_state`, `financeiro_grants` e a função `has_financeiro()`
  são as mesmas (migration `../supabase/migrations/029_financeiro_state_grants.sql`).
- O **webhook da Hotmart** já existente (`../supabase/functions/hotmart-webhook`)
  grava os grants por e-mail. Não precisa de webhook próprio.
- A **trava real** é o RLS no banco: sem grant ativo, o Supabase recusa ler/gravar
  o estado financeiro — não dá pra burlar pela tela.

## Como o cadeado funciona

1. Cliente compra na Hotmart → webhook grava `financeiro_grants` pelo e-mail.
2. Cliente cria conta (`/cadastro`) ou entra (`/entrar`) com o **mesmo e-mail**.
3. `/app` chama `has_financeiro()`. Liberado → abre o app; senão → tela de cadeado
   com botão de compra.

> Comprou com e-mail diferente do login? Suporte libera na mão (SQL no fim da
> migration 029).

## Rodando localmente

```bash
cd financeiro
cp .env.local.example .env.local   # preencha com as chaves do MESMO Supabase do BarberMeta
npm install
npm run dev
```

Variáveis (`.env.local`):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — do projeto Supabase do BarberMeta.
- `SUPABASE_SERVICE_ROLE_KEY` — service role (server-only).
- `NEXT_PUBLIC_HOTMART_URL` — link de checkout do Controle Financeiro.

## Deploy

Projeto Vercel separado apontando para a pasta `financeiro/` como root
(mesmo padrão do `bussola/`). Configure as mesmas envs acima.

## Estrutura

```
src/
  app/
    oferta/        — landing/venda (rota pública padrão pra visitante)
    entrar/        — login
    cadastro/      — criação de conta (use o e-mail da compra)
    app/           — o Controle Financeiro, atrás do cadeado (FinanceiroGate)
    auth/callback/ — troca de código por sessão (Supabase)
    api/sair/      — logout
  components/financeiro/
    FinanceiroGate.tsx     — cadeado + upsell (checa has_financeiro)
    ControleFinanceiro.tsx — o app financeiro em si (estado no Supabase)
  lib/financeiro/
    supabaseStore.ts  — load/save do estado + has_financeiro()
    serverActions.ts  — auto-sync opcional de comissões (só p/ quem tem barbearia)
  lib/ciclo.ts        — cálculo do ciclo de fechamento (usado pelo auto-sync)
  utils/supabase/     — clients (browser/server/middleware/admin)
  middleware.ts       — protege /app e redireciona quem já está logado
```

## Integração com o BarberMeta (opcional)

`serverActions.ts` importa comissões da equipe quando o usuário **também** é dono
de barbearia no mesmo Supabase. Cliente standalone sem barbearia cadastra a equipe
na mão — o botão de importar apenas avisa que não há barbearia, sem quebrar nada.
