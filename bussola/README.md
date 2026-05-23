# Bússola

Gestão de pessoas e reuniões semanais para donos de barbearia (e, depois, outros
nichos de serviço). Este repositório contém o **setup inicial** (Prompt 1 de 6):
autenticação do dono, onboarding e painel vazio.

> Codinome do projeto. O nome final será decidido depois.

## Stack

- Next.js 14 (App Router) + TypeScript
- Supabase (banco + auth)
- Tailwind CSS
- Deploy na Vercel

## Estrutura

```
src/
  middleware.ts            # protege /painel e /onboarding; redireciona p/ /entrar
  utils/supabase/
    client.ts              # cliente browser
    server.ts              # cliente server (Server Components / actions)
    middleware.ts          # refresh de sessão usado pelo middleware
  app/
    entrar/                # login (email + senha)
    cadastro/              # criar conta (signup aberto por enquanto)
    esqueci-senha/         # solicitar link de redefinição
    redefinir-senha/       # definir nova senha (após callback)
    auth/callback/         # troca o código do Supabase por sessão
    onboarding/            # 1 tela: cria o estabelecimento do dono
    painel/                # home (vazia por enquanto)
supabase/migrations/
  001_initial_schema.sql   # tabelas + RLS
```

## Rodando localmente

1. `cp .env.local.example .env.local` e preencha os valores (ver abaixo).
2. `npm install`
3. `npm run dev` → http://localhost:3000

## Variáveis de ambiente

Em `.env.local` (local) e nas variáveis da Vercel (Production + Preview + Development):

| Variável | Onde achar no Supabase |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → service_role (secreta!) |
| `ANTHROPIC_API_KEY` | console.anthropic.com (usado a partir do Prompt 2) |

## Supabase — passo a passo

1. Crie um projeto novo em https://supabase.com.
2. Em **SQL Editor**, cole o conteúdo de `supabase/migrations/001_initial_schema.sql`
   e execute. Isso cria as 5 tabelas e o RLS.
3. Em **Authentication → Providers → Email**: deixe habilitado.
   - Para testar o cadastro sem caixa de entrada, você pode **desabilitar
     "Confirm email"** temporariamente. A tela de cadastro já trata os dois casos.
4. Em **Authentication → URL Configuration**:
   - **Site URL**: a URL do deploy (ex.: `https://bussola.vercel.app`) — em dev, `http://localhost:3000`.
   - **Redirect URLs**: adicione `http://localhost:3000/auth/callback` e
     `https://SEU-DOMINIO/auth/callback`. Isso é necessário para o link de
     "esqueci minha senha" funcionar.

## GitHub

Este código foi gerado dentro do repositório `barbademoi/demoi`, na pasta `bussola/`,
na branch de desenvolvimento. Para virar um projeto independente:

```bash
# a partir da pasta bussola/
git init
git add .
git commit -m "feat: setup inicial da Bússola"
# crie um repositório privado vazio chamado "bussola" no GitHub e:
git remote add origin git@github.com:SEU-USUARIO/bussola.git
git push -u origin main
```

## Vercel

1. **Add New → Project** e importe o repositório `bussola`.
2. Em **Environment Variables**, adicione as 4 variáveis acima (todas em
   Production, Preview e Development).
3. Deploy. Depois, copie a URL do deploy e coloque em **Supabase → Auth → URL
   Configuration** (Site URL + Redirect URL `/auth/callback`).

## O que ainda não existe

Tudo que está nos Prompts 2 a 6 (feedbacks, profissionais, reuniões com IA, metas,
etc.). Esta base só cobre auth + onboarding + painel vazio.
