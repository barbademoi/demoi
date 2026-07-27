# Reativação de clientes via WhatsApp

Ferramenta pessoal, **separada do BarberMeta**, pra reativar clientes que
sumiram da barbearia. Envio é **semi-manual**: o sistema nunca dispara
mensagem sozinho — ele só prepara o link do WhatsApp com o texto já
preenchido, e quem revisa e clica em enviar é você, um cliente por vez.

## Fluxo

1. **Importar**: sobe um CSV/Excel exportado do seu sistema de agenda (nome,
   telefone com DDD, data do último corte). O telefone é normalizado pro
   padrão internacional do WhatsApp (`55` + DDD + número) e a data é
   interpretada no formato brasileiro (dd/mm/aaaa).
2. **Filtrar**: define "sem cortar há pelo menos X dias" e vê a lista
   ordenada de quem sumiu há mais tempo pra quem sumiu há menos tempo.
3. **Gerar mensagem (IA)**: cada cliente tem um botão "Gerar mensagem", que
   chama a Anthropic API e escreve um texto curto e personalizado (variando
   o texto entre os clientes). Dá pra editar o texto à mão e pedir "Gerar
   nova versão" quantas vezes quiser.
4. **Abrir no WhatsApp**: abre `wa.me/<numero>?text=<mensagem>` numa aba
   nova, com o texto pronto. Você revisa e manda manualmente.
5. **Marcar como contatado**: some da lista (fica salvo entre sessões), pra
   não mandar mensagem duas vezes pro mesmo cliente.

## Como rodar localmente

```bash
cd reativacao-whatsapp
cp .env.local.example .env.local
# edite .env.local e cole sua ANTHROPIC_API_KEY (pode reaproveitar a do BarberMeta)

npm install
npm run dev
```

Abre em [http://localhost:3100](http://localhost:3100).

Os dados (clientes importados, quem já foi contatado, a instrução de tom da
IA) ficam salvos em arquivos JSON dentro de `data/` — não precisa de banco de
dados nem login. Essa pasta **não é versionada no git** (são dados de
clientes reais da sua barbearia).

## Deploy

Dá pra rodar num serviço qualquer que suporte Next.js com sistema de
arquivos persistente (uma VPS simples, um servidor próprio, um container com
disco persistente, etc.) — é só rodar `npm run build && npm start`.

**Atenção se for hospedar em serverless (ex: Vercel):** o filesystem nesses
ambientes é somente-leitura/efêmero em produção, então a persistência em
`data/*.json` **não funciona** lá — os dados (clientes importados, quem foi
contatado) somem a qualquer momento. Pra essa ferramenta, que é de uso
pessoal e não precisa escalar, o mais simples é rodar localmente na sua
máquina ou numa VPS/serviço com disco persistente. Se um dia quiser hospedar
em serverless, dá pra trocar `lib/store.ts` por um banco simples (ex:
Supabase, como o BarberMeta já usa), mas isso está fora do escopo desta
versão.

## Nada é enviado automaticamente

Confirmando: essa ferramenta **não dispara nenhuma mensagem sozinha**. A
Anthropic API só é usada pra *gerar o texto*. Quem decide se envia, revisa o
texto e clica pra enviar dentro do WhatsApp é sempre você, cliente por
cliente — reduzindo o risco de o número ser banido por disparo em massa.

## Estrutura

```
reativacao-whatsapp/
  app/
    page.tsx           # tela única
    api/upload          # importa CSV/Excel
    api/clientes         # lista filtrada/ordenada
    api/mensagem          # gera texto via Anthropic
    api/contatar           # marca/desmarca contatado
    api/config               # instrução de tom da IA
  components/            # Uploader, ConfigIA, ClienteRow
  lib/
    telefone.ts    # normalização de telefone BR -> wa.me
    datas.ts        # parsing de data BR + fuso America/Sao_Paulo
    parse.ts          # leitura de CSV (parser próprio) e Excel (xlsx)
    clientes.ts         # merge de importação com a base existente
    store.ts               # persistência em JSON local
    anthropic.ts              # geração de mensagem com variação
  data/                   # dados salvos (git-ignorado)
```
