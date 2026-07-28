# Agenda Serviço → BarberMeta

Extensão pessoal do Chrome para atualizar o BarberMeta a partir do relatório
aberto no Agenda Serviço.

## Como os dados são obtidos

1. A extensão procura uma resposta estruturada do relatório entre os recursos
   que a própria página já carregou e tenta reutilizar a mesma URL com os
   cookies da sessão aberta.
2. Se não houver resposta estruturada reconhecível, lê a tabela-resumo visível
   no HTML.
3. Se a aba aberta for o PDF do relatório, envia o próprio PDF ao BarberMeta,
   que usa o mesmo leitor estrito do importador manual.

Em todos os caminhos, o envio só ocorre quando período, profissionais,
serviços, produtos, assinaturas, faturamento bruto e comissão passam pela
validação. O faturamento também precisa fechar com a soma das três categorias.

## Segurança

- Nenhuma senha ou cookie do Agenda Serviço é lido ou salvo.
- A permissão do Agenda é solicitada apenas para o endereço que estiver aberto.
- Somente o token privado do BarberMeta fica salvo no armazenamento local da
  extensão.
- O endpoint fixa o destino em `barbeariademoi@gmail.com`; não aceita escolher
  outra conta ou barbearia.
- Um nome sem de-para previamente confirmado é recusado.

## Instalação local

1. Configure `AGENDA_EXTENSION_TOKEN` no ambiente do BarberMeta com um segredo
   aleatório de pelo menos 32 caracteres.
2. Abra `chrome://extensions`, ative o **Modo do desenvolvedor** e use
   **Carregar sem compactação**.
3. Selecione esta pasta `chrome-extension-agenda`.
4. Abra a extensão, cole o mesmo token privado e salve.
5. Deixe o relatório de faturamento total aberto no Agenda Serviço e clique em
   **Atualizar infos no BarberMeta**.

Se o relatório não estiver aberto ou a sessão tiver expirado, a extensão
informa o problema e não envia nada.
