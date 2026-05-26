// Normaliza um telefone BR para o formato do wa.me (só dígitos, com DDI 55).
export function normalizarTelefone(tel: string | null | undefined): string | null {
  if (!tel) return null
  const d = tel.replace(/\D/g, '')
  if (!d) return null
  if (d.startsWith('55') && d.length >= 12) return d
  if (d.length === 10 || d.length === 11) return `55${d}`
  return d
}

export function linkWhats(telefoneNormalizado: string, mensagem: string): string {
  return `https://wa.me/${telefoneNormalizado}?text=${encodeURIComponent(mensagem)}`
}

export function mensagemElogio(primeiroNome: string, texto: string, url: string): string {
  return `Oi ${primeiroNome}!

Quero registrar aqui o reconhecimento:

✨ ${texto}

Continue assim. Bom trabalho!

Ver seus elogios: ${url}`
}

export function mensagemConvite(nome: string, url: string): string {
  return `Oi ${nome}!

Esse é o link onde vou registrar reconhecimentos pelo seu trabalho:

${url}

Salva esse link na tela inicial do celular pra acompanhar.`
}

// Mensagem neutra para envio pontual (pode ser elogio ou um recado).
export function mensagemFeedback(primeiroNome: string, texto: string): string {
  return `Oi ${primeiroNome}!

${texto}`
}

// Abre a folha de compartilhamento nativa (iOS/Android) — onde o usuário
// escolhe WhatsApp OU WhatsApp Business. Cai no link wa.me se não houver
// suporte (ex.: desktop). Use somente no cliente, dentro de um gesto.
export async function enviarWhats(mensagem: string, telefone: string | null): Promise<void> {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined
  if (nav?.share) {
    try {
      await nav.share({ text: mensagem })
    } catch {
      // usuário cancelou — não faz fallback
    }
    return
  }
  const tel = normalizarTelefone(telefone)
  const href = tel ? linkWhats(tel, mensagem) : `https://wa.me/?text=${encodeURIComponent(mensagem)}`
  if (typeof window !== 'undefined') window.location.href = href
}
