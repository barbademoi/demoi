/**
 * A MENSAGEM DA CONFERÊNCIA DA BRINDOLETA — escolhida por lógica, sem IA.
 *
 * Não é elogio automático: a frase muda conforme o que os números realmente
 * dizem, e cada estado tem um próximo passo concreto. Parabenizar quem não
 * vendeu nada seria vazio, e cobrar quem já está vendendo seria injusto —
 * quem lê isto é o barbeiro, e ele sabe exatamente como foi o mês dele.
 *
 * Nada de comparação com colegas: além de o dado não estar aqui de propósito
 * (cada barbeiro só enxerga o próprio), transformar a conferência em ranking
 * mudaria o que a tela é.
 */

import type { ResumoBrindoletaBarbeiro } from './resumoBarbeiro'

export interface MensagemBrindoleta {
  titulo: string
  texto: string
}

export function mensagemMotivacional(r: ResumoBrindoletaBarbeiro): MensagemBrindoleta {
  const { giros, resgates, confirmadas, pendentes, valorConfirmadoCents } = r

  // 1) Ninguém girou. Não há o que celebrar nem o que cobrar — só o passo.
  if (giros === 0) {
    return {
      titulo: 'Sua roleta ainda não girou',
      texto: 'Mostre o seu QR Code no fim do atendimento. Leva dez segundos e é o que coloca a oferta na mesa — sem ele, a roleta não sabe que o cliente foi seu.',
    }
  }

  // 2) Estão girando, mas ninguém aceitou. O gargalo é a hora do prêmio.
  if (resgates === 0) {
    return {
      titulo: `${giros} ${giros === 1 ? 'cliente girou' : 'clientes giraram'} com você`,
      texto: 'Já é o começo: a roleta está na mão do cliente. Quando o prêmio aparecer, diga em voz alta o que ele ganhou e ofereça na hora — é essa frase que transforma o giro em venda.',
    }
  }

  // 3) Teve resgate, mas ainda não há valor lançado. O valor depende do dono
  //    conferir, então a frase explica isso em vez de mostrar R$ 0,00.
  if (valorConfirmadoCents <= 0) {
    const pendencia = pendentes > 0
      ? `${pendentes} ${pendentes === 1 ? 'está' : 'estão'} esperando o dono conferir.`
      : 'O valor aparece aqui assim que o dono lançar quanto a venda rendeu.'
    return {
      titulo: `${resgates} ${resgates === 1 ? 'oferta resgatada' : 'ofertas resgatadas'}`,
      texto: `Cliente aceitou o que você ofereceu — essa é a parte difícil. ${pendencia}`,
    }
  }

  // 4) Tem dinheiro confirmado. O VALOR não entra aqui de propósito: ele está
  //    no card logo abaixo, e repetir o mesmo número duas vezes na mesma tela
  //    faz a mensagem parecer enfeite. Aqui vai a leitura, não o dado.
  const taxa = (resgates / giros) * 100

  if (taxa >= 50) {
    return {
      titulo: 'Você está convertendo muito bem',
      texto: 'Mais da metade de quem girou com você levou uma oferta — isso é conversa boa no atendimento, não sorte da roleta. Continue oferecendo do mesmo jeito.',
    }
  }

  return {
    titulo: 'Sua roleta já está vendendo',
    texto: `${confirmadas} ${confirmadas === 1 ? 'venda confirmada' : 'vendas confirmadas'} a partir da roleta. Cada giro é uma chance de oferecer: quanto mais clientes girarem com você, mais esse valor sobe.`,
  }
}
