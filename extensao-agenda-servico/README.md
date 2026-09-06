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

## PARTE 0 — de onde vêm os dados (já investigado no agendas.link)

Investigado pelo Network do Agenda Serviço (`agendas.link`). Conclusão:

- **Totais da CASA → endpoint JSON interno (CASO A).** A extensão chama, na
  própria sessão logada, `get-dados-faturamento-bruto.ajax.php`, que devolve
  `{ faturamento_total, faturamento_servicos, faturamento_assinaturas,
  faturamento_produtos }`. Números oficiais, limpos.
- **Por barbeiro → montado na tela (CASO B).** Os endpoints JSON do Agenda
  Serviço são **só a nível de casa ou de cadastro** (`getDadosFuncionarios` =
  id/nome/% comissão; `getDadosServicosParaFuncionarios` = configuração).
  **Nenhum devolve o valor em R$ por barbeiro** — esse detalhe (tabela "Total
  detalhado" + cards) é calculado na página. Então a extensão lê essa tabela
  renderizada na mesma aba logada.

O extrator já faz isso automaticamente: totais da casa via JSON + por barbeiro
lendo a tabela "Total detalhado" (barbeiros nas colunas, métricas nas linhas).
Como tentativa extra, ainda chama `getPagamento.ajax.php` — se um dia ele
responder com comissão por barbeiro, entra no lugar da leitura de tela.

### Se algum número sair errado

Abra `extrator.js` e ajuste:
- **`EP_CASA`** — caminho(s) do endpoint de totais da casa (já preenchido).
- **`classificar()`** — sinônimos das colunas/linhas (serviços, produtos,
  assinaturas, comissão…) caso a sua tela use outros títulos.
- Rode uma vez com o relatório aberto: o popup mostra quantos barbeiros casaram
  e quais ficaram "sem correspondência", então dá pra ver na hora se algo saiu
  torto.

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
| "…Importação indisponível no momento." | Faltam `AGENDA_IMPORT_TOKEN`/`AGENDA_IMPORT_EMAIL` no ambiente da Vercel. |
| "…Conta configurada não encontrada." | `AGENDA_IMPORT_EMAIL` não bate com nenhum usuário do BarberMeta. |
| "…erro 500 no servidor (nenhuma mensagem)" | Variável de ambiente faltando na Vercel — em geral `SUPABASE_SERVICE_ROLE_KEY`. Não é problema do seu cadastro. |
| "…Nada foi gravado: as escritas no banco falharam." | Os nomes casaram, mas o banco recusou a escrita. Tente de novo; se persistir, é problema no BarberMeta. |

### Barbeiro que não foi importado

A importação **nunca falha inteira** por causa de um nome: quem casa entra, quem não casa é listado com o motivo. São três motivos diferentes, e a ação é diferente em cada um:

| Mensagem | O que fazer |
|---|---|
| "○ Ignorado por estar DESATIVADO no BarberMeta: Fulano" | O nome está certo. Reative em Configurações → Equipe se ele ainda trabalha aí. Não procure erro de digitação. |
| "○ Ignorado por ter sido EXCLUÍDO do BarberMeta: Fulano" | Ele foi apagado de vez. Se voltou, cadastre de novo. |
| "○ Falta confirmar o de-para de: Fulano" | Abra **Importar relatório** no BarberMeta e diga uma vez quem é esse nome. Depois disso ele entra sozinho em toda importação — sem precisar renomear ninguém. Se o nome não for uma pessoa (linha de total, serviço avulso), marque "Não é ninguém" e ele para de aparecer. |
| "Nenhum barbeiro foi importado…" | Nenhum nome do relatório casou com a equipe. A extensão mostra isso em vermelho — não é sucesso. |
