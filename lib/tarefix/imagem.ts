/**
 * Comprime uma foto no navegador antes do upload:
 * lado maior até `max` px, JPEG com qualidade `qualidade`.
 */
export async function comprimirImagem(arquivo: File, max = 1280, qualidade = 0.7): Promise<Blob> {
  const url = URL.createObjectURL(arquivo)
  try {
    const img = await new Promise<HTMLImageElement>((ok, erro) => {
      const i = new Image()
      i.onload = () => ok(i)
      i.onerror = () => erro(new Error('Não consegui ler a imagem.'))
      i.src = url
    })
    const escala = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.round(img.naturalWidth * escala)
    const h = Math.round(img.naturalHeight * escala)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Navegador sem suporte a canvas.')
    ctx.drawImage(img, 0, 0, w, h)
    return await new Promise<Blob>((ok, erro) =>
      canvas.toBlob((b) => (b ? ok(b) : erro(new Error('Falha ao comprimir.'))), 'image/jpeg', qualidade)
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}
