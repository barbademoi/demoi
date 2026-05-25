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
