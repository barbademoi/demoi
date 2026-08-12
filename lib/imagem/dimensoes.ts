/**
 * LARGURA E ALTURA DE UMA IMAGEM, lidas do cabeçalho dos bytes.
 *
 * Existe porque o Satori (motor do next/og) NÃO respeita `object-fit: contain`
 * nem `max-width` em `<img>`: ele desenha na caixa que receber e corta o que
 * sobra. Uma logo larga saía com as pontas cortadas. Sabendo a proporção real,
 * dá pra calcular o encaixe e passar largura e altura exatas — aí não existe
 * distorção nem corte, independente do que o motor faz.
 *
 * Sem dependência nova: são quatro formatos e cada um diz o tamanho nos
 * primeiros bytes. Formato desconhecido devolve null, e quem chama trata.
 */

export interface Dimensoes {
  largura: number
  altura: number
}

export function dimensoesDaImagem(buf: Buffer): Dimensoes | null {
  if (buf.length < 24) return null

  // PNG: assinatura + IHDR com largura/altura em big-endian.
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { largura: buf.readUInt32BE(16), altura: buf.readUInt32BE(20) }
  }

  // GIF: "GIF8" + largura/altura em little-endian.
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    return { largura: buf.readUInt16LE(6), altura: buf.readUInt16LE(8) }
  }

  // WEBP: contêiner RIFF, com três variantes de bloco.
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const bloco = buf.toString('ascii', 12, 16)
    if (bloco === 'VP8X') {
      return {
        largura: 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16)),
        altura: 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16)),
      }
    }
    if (bloco === 'VP8 ') {
      return { largura: buf.readUInt16LE(26) & 0x3fff, altura: buf.readUInt16LE(28) & 0x3fff }
    }
    if (bloco === 'VP8L') {
      const b = buf.readUInt32LE(21)
      return { largura: (b & 0x3fff) + 1, altura: ((b >> 14) & 0x3fff) + 1 }
    }
    return null
  }

  // JPEG: percorre os marcadores até um SOF, que é quem carrega o tamanho.
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue }
      const marcador = buf[i + 1]
      // SOF0..SOF15, exceto DHT (c4), JPGA (c8) e DAC (cc), que não são SOF.
      if (marcador >= 0xc0 && marcador <= 0xcf
          && marcador !== 0xc4 && marcador !== 0xc8 && marcador !== 0xcc) {
        return { altura: buf.readUInt16BE(i + 5), largura: buf.readUInt16BE(i + 7) }
      }
      const tamanho = buf.readUInt16BE(i + 2)
      if (tamanho < 2) return null
      i += 2 + tamanho
    }
  }

  return null
}

/** Maior tamanho que cabe na caixa mantendo a proporção. Nunca amplia. */
export function encaixar(d: Dimensoes, caixa: number): Dimensoes {
  if (d.largura <= 0 || d.altura <= 0) return { largura: caixa, altura: caixa }
  const escala = Math.min(caixa / d.largura, caixa / d.altura, 1)
  return {
    largura: Math.max(1, Math.round(d.largura * escala)),
    altura: Math.max(1, Math.round(d.altura * escala)),
  }
}
