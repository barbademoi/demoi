'use server'

import { createClient } from '@/lib/supabase/server'
import { digitos } from '@/lib/format'
import { DISPOSICAO, DOR, FATURAMENTO, ORIGEM, PERFIL, UFS, valido } from '@/lib/opcoes'

export type ResultadoLead = { ok: true } | { ok: false; erros: Record<string, string>; mensagem?: string }

function texto(fd: FormData, k: string, max = 200): string {
  return String(fd.get(k) ?? '').trim().slice(0, max)
}

export async function entrarNaLista(fd: FormData): Promise<ResultadoLead> {
  // Armadilha para robô: campo escondido que gente de verdade não preenche.
  if (texto(fd, 'site')) return { ok: true }

  const erros: Record<string, string> = {}
  const nome = texto(fd, 'nome', 120)
  const whatsapp = digitos(texto(fd, 'whatsapp', 30))
  const cidade = texto(fd, 'cidade', 120)
  const uf = texto(fd, 'uf', 2).toUpperCase()
  const perfil = texto(fd, 'perfil')
  const disposicao = texto(fd, 'disposicao')
  const autoriza = fd.get('autoriza') === 'on'

  if (nome.length < 2) erros.nome = 'Coloca seu nome.'
  if (whatsapp.length < 10 || whatsapp.length > 11) erros.whatsapp = 'Coloca o WhatsApp com DDD.'
  if (cidade.length < 2) erros.cidade = 'Coloca sua cidade.'
  if (!UFS.includes(uf)) erros.uf = 'Escolhe o estado.'
  if (!valido(PERFIL, perfil)) erros.perfil = 'Escolhe uma opção.'
  if (!valido(DISPOSICAO, disposicao)) erros.disposicao = 'Escolhe uma opção.'
  if (!autoriza) erros.autoriza = 'Precisa autorizar o contato pra gente te avisar.'

  const instagram = texto(fd, 'instagram', 80).replace(/^@+/, '') || null
  const numStr = digitos(texto(fd, 'num_barbeiros', 5))
  const num_barbeiros = numStr ? Math.min(Math.max(Number(numStr), 1), 200) : null
  const faturamento = texto(fd, 'faturamento') || null
  const dor = texto(fd, 'dor') || null
  const dor_outro = dor === 'outro' ? texto(fd, 'dor_outro', 300) || null : null
  const origem = texto(fd, 'origem') || null

  if (faturamento && !valido(FATURAMENTO, faturamento)) erros.faturamento = 'Opção inválida.'
  if (dor && !valido(DOR, dor)) erros.dor = 'Opção inválida.'
  if (origem && !valido(ORIGEM, origem)) erros.origem = 'Opção inválida.'

  if (Object.keys(erros).length) return { ok: false, erros }

  let utm: Record<string, string> | null = null
  const utmRaw = texto(fd, 'utm', 1000)
  if (utmRaw) {
    try {
      const obj = JSON.parse(utmRaw)
      utm = {}
      for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
        if (typeof obj[k] === 'string') utm[k] = obj[k].slice(0, 120)
      }
      if (!Object.keys(utm).length) utm = null
    } catch {
      utm = null
    }
  }

  const supabase = createClient()
  const { error } = await supabase.from('leads').insert({
    nome,
    whatsapp,
    cidade,
    uf,
    perfil,
    disposicao,
    autoriza_contato: true,
    instagram,
    num_barbeiros,
    faturamento,
    dor,
    dor_outro,
    origem,
    utm,
  })

  if (error) {
    console.error('[lista] erro ao salvar lead', error)
    return { ok: false, erros: {}, mensagem: 'Não deu pra salvar agora. Tenta de novo em instantes.' }
  }
  return { ok: true }
}
