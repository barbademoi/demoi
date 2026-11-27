# MDC — Método Demôi de Crescimento

Plataforma da mentoria em grupo do Carlos Henrique Demôi: lista de espera,
vendas com confirmação manual de pagamento, área do membro com conteúdo
liberado por semana e acompanhamento das missões.

App Next.js **independente** dentro do repositório (pasta `mdc/`), com projeto
Supabase próprio e projeto Vercel próprio, no domínio `metododemoi.com.br`.
Não mexe em nada do BarberMeta (raiz do repositório).

## Stack
- Next.js 14 (App Router) + TypeScript + Tailwind
- Supabase: banco, autenticação e storage
- Vercel

## Fases
| Fase | O que entrega | SQL |
| --- | --- | --- |
| 1 | Lista de espera, confirmação, admin de leads, textos editáveis | `supabase/migrations/001_fase1_lista_espera.sql` |
| 2 | Página de vendas, compra, comprovante, diagnóstico, membros, vencimentos | `002_fase2_vendas.sql` |
| 3 | Área do membro: início, missões, ranking, biblioteca, plano; admin de conteúdo | `003_fase3_area_membro.sql` |

Rode os arquivos SQL **em ordem**, no SQL Editor do Supabase. Todos podem ser
rodados de novo sem estragar nada.

## Variáveis de ambiente
| Variável | Onde achar |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role (**secreta**) |
| `NEXT_PUBLIC_SITE_URL` | `https://metododemoi.com.br` (em dev: `http://localhost:3000`) |

## Rodar localmente
```bash
cd mdc
cp .env.example .env.local   # e preencha
npm install
npm run dev                  # http://localhost:3000
```

## Supabase — primeira vez
1. Crie um projeto **novo** em supabase.com (região São Paulo).
2. SQL Editor → cole e rode `supabase/migrations/001_fase1_lista_espera.sql`
   (e depois os das próximas fases).
3. Authentication → Users → **Add user** com o seu e-mail e senha
   (marque "Auto Confirm User").
4. SQL Editor → vire admin:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'SEU-EMAIL'
   on conflict do nothing;
   ```
5. Authentication → URL Configuration:
   - Site URL: `https://metododemoi.com.br`
   - Redirect URLs: `https://metododemoi.com.br/auth/callback` e
     `http://localhost:3000/auth/callback`

## Publicar na Vercel
1. Vercel → Add New → Project → importe `barbademoi/demoi`.
2. **Root Directory: `mdc`** (importante: é o que separa do BarberMeta).
   Framework: Next.js (detecta sozinho).
3. Environment Variables: as 4 de cima, em Production, Preview e Development.
4. Deploy.
5. Settings → Domains → adicione `metododemoi.com.br` e `www.metododemoi.com.br`.
   No registro do domínio (Registro.br), aponte conforme a Vercel mostrar:
   - `metododemoi.com.br` → registro **A** `76.76.21.21`
   - `www` → **CNAME** `cname.vercel-dns.com`
6. Teste: abra o site, entre na lista, entre em `/entrar` com o admin e veja
   o lead em `/admin/leads`.

## Rotas
### Fase 1
- `/` lista de espera · `/pronto` confirmação
- `/entrar`, `/esqueci-senha`, `/redefinir-senha`
- `/admin/leads` (filtros, busca, status, anotação, WhatsApp, CSV)
- `/admin/configuracoes` (textos da página, link do grupo, mensagem do WhatsApp)

### Fase 2
- `/mdc` página de vendas (textos, resultados e perguntas editáveis em `/admin/vendas`)
- `/comprar` → plano → conta + aceite do termo (salva data/hora, versão, IP)
- `/comprar/pagamento` → link InfinitePay (cartão) ou Pix com QR Code gerado
  com o valor do plano → "Já paguei" com comprovante (imagem ou PDF)
- `/aguardando` "Recebemos! Assim que o pagamento for confirmado, seu acesso é liberado."
- `/renovar` tela de quem venceu (ou quer renovar antes), com envio de comprovante
- `/termo` texto do termo de adesão
- `/app/diagnostico` diagnóstico de entrada em 6 etapas (rascunho no aparelho)
- `/app/reavaliacao` reavaliação de 90 dias (abre na semana 13 do membro)
- `/admin/membros` lista, filtros por status, comprovantes na fila
- `/admin/membros/[id]` ver comprovante (link assinado), confirmar/recusar,
  registrar pagamento sem comprovante, fundador/convidado, ajuste manual,
  aceite do termo, diagnóstico e comparação entrada × 90 dias
- `/admin/vencimentos` vence em 5 dias / hoje / venceu ontem, com WhatsApp pronto
- `/admin/diagnosticos` quem respondeu o quê
- `/admin/configuracoes` + pagamento, termo e mensagens de vencimento

#### Regras de datas (confirmar pagamento)
- Primeira confirmação: início = data escolhida (padrão: hoje; fundador: 18/01/2027).
  Vencimento = início + 6 meses (semestral) ou + 1 mês (mensal).
- Renovação: soma a partir do vencimento atual, mesmo se pagar antes ou com até
  15 dias de atraso. Mais que isso, conta a partir da data do pagamento.
- O dia do vencimento ainda tem acesso. No dia seguinte, o membro vê `/renovar`.
- Confirmar a primeira vez marca o lead com o mesmo WhatsApp como "comprou".
