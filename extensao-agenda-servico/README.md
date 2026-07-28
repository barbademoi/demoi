# Extensão "Atualizar infos no BarberMeta" (uso próprio)

Pega o relatório de faturamento do **Agenda Serviço** — usando a sessão que já
está logada no seu navegador — e envia pro **BarberMeta**, gravando igual ao
lançamento diário (acumulado por dia, sobrescreve o dia se reenviar, não
duplica). **Nunca pede nem guarda senha:** o código roda dentro da aba já logada
e reaproveita os cookies dela. O tráfego pro BarberMeta leva só os números do
relatório + um token de importação.

---

## Como funciona (visão rápida)

1. Você abre o Agenda Serviço, faz login e vai até a **tela do relatório de
   faturamento** (por barbeiro).
2. Clica no ícone da extensão → **Atualizar infos**.
3. A extensão injeta um leitor na própria aba (mesma sessão) e extrai:
   faturamento, comissão, serviços, produtos, assinaturas e atendimentos por
   barbeiro.
4. Manda pro `POST /api/import-agenda` do BarberMeta com o token.
5. Mostra "✓ Enviado — X barbeiros atualizados" (ou o erro).

Se o Agenda Serviço **não** estiver aberto/logado na tela do relatório, ela
avisa sem quebrar nada.

---

## PARTE 0 — de onde vêm os dados (leia antes de usar de verdade)

O extrator já tenta **os dois caminhos automaticamente**, mas só o segundo
funciona sem ajuste:

- **CASO A — endpoint JSON interno (ideal):** se a página do Agenda Serviço monta
  o relatório chamando uma API JSON própria, a extensão chama **a mesma URL** com
  `credentials:'include'` (usa seu login) e recebe os números limpos. Você
  precisa **descobrir e preencher essa URL** — veja "Como capturar" abaixo.
- **CASO B — só HTML na tela (padrão que já funciona):** se o relatório é uma
  tabela renderizada, o parser genérico lê a tabela mapeando as colunas pelos
  títulos. Funciona sem você mexer em nada, desde que a tela mostre uma tabela
  com uma coluna de nome + faturamento/comissão.

> **Por que preciso capturar?** Não tenho como abrir/inspecionar o *seu* Agenda
> Serviço daqui. Por isso a extensão vem preparada pros dois casos, e você decide
> qual usar depois de olhar a rede uma vez.

### Como capturar (5 min, uma vez)

1. Abra o Agenda Serviço, vá até o relatório de faturamento.
2. `F12` → aba **Network** (Rede) → filtro **Fetch/XHR**.
3. Recarregue o relatório (ou troque o período) e veja as requisições que
   aparecem.
4. **Se aparecer uma requisição que retorna JSON com os números** (CASO A):
   - Copie a URL (ex.: `/api/relatorios/faturamento?inicio=...&fim=...`).
   - Abra `extrator.js` e coloque a URL em `ENDPOINTS_JSON`.
   - Olhe o formato do JSON e ajuste `mapearJson()` se os nomes dos campos forem
     diferentes (ex.: `total_bruto` em vez de `faturamento`).
5. **Se não houver JSON, só o HTML da tabela** (CASO B):
   - Não precisa mexer em nada. Se as colunas não forem reconhecidas, ajuste os
     sinônimos em `COLUNAS` (dentro de `extrator.js`) com os títulos exatos que
     aparecem na sua tela.

---

## Instalar a extensão

1. Chrome → `chrome://extensions`.
2. Ligue o **Modo do desenvolvedor** (canto superior direito).
3. **Carregar sem compactação** → selecione a pasta `extensao-agenda-servico`.
4. Fixe a extensão na barra (opcional).
5. Clique no ícone → **Configurar (uma vez)**:
   - **URL do BarberMeta:** `https://barbermeta.com.br` (ou seu domínio).
   - **Token de importação:** o mesmo valor de `AGENDA_IMPORT_TOKEN` (abaixo).
   - **Salvar config.**

---

## Lado BarberMeta — variáveis de ambiente (na Vercel)

O endpoint `/api/import-agenda` só funciona com estas duas variáveis
configuradas (Project → Settings → Environment Variables → Production):

| Variável | O que é |
|---|---|
| `AGENDA_IMPORT_TOKEN` | Um segredo forte que você inventa (ex.: 40+ caracteres aleatórios). Protege o endpoint — só quem tem o token importa. É o mesmo que você cola na extensão. |
| `AGENDA_IMPORT_EMAIL` | O e-mail do **seu** login no BarberMeta. O endpoint resolve a barbearia por esse e-mail, então a importação sempre cai na **sua** conta (RLS por barbearia). |

> Gerar um token bom: `openssl rand -hex 32` (ou qualquer gerador de senha
> longa). Guarde só na Vercel e na extensão — em lugar nenhum público.

Depois de setar as duas, faça um redeploy pra elas entrarem em vigor.

---

## Segurança / privacidade

- **Sem senha, em lugar nenhum.** A leitura acontece na aba já logada; a extensão
  não vê nem trafega sua senha do Agenda Serviço.
- **Endpoint protegido por token** + amarrado ao seu e-mail (`AGENDA_IMPORT_EMAIL`).
  Grava sempre na sua barbearia (RLS).
- **Fuso America/Sao_Paulo:** o ciclo é calculado pelo `dia_fechamento` da sua
  barbearia; `referencia` é o dia (BR) em que você clicou.
- **Idempotente:** reenviar o mesmo dia sobrescreve a foto daquele dia — não
  duplica. Ciclo fechado é recusado (reabra pra reimportar).

---

## Resolução de problemas

| Mensagem | O que fazer |
|---|---|
| "Configure o token…" | Preencha o token em Configurar e salve. |
| "Abra e faça login no Agenda Serviço…" | Vá pra aba do Agenda Serviço, na tela do relatório, e clique de novo. |
| "BarberMeta recusou: Não autorizado." | Token da extensão ≠ `AGENDA_IMPORT_TOKEN` da Vercel. |
| "…Ciclo … está fechado." | Reabra o ciclo no BarberMeta e reimporte. |
| "⚠ Sem correspondência: Fulano" | O nome no Agenda Serviço não bate com nenhum barbeiro ativo no BarberMeta. Ajuste o nome (ou os sinônimos de coluna). |
