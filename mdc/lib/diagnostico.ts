// Perguntas do diagnóstico de entrada e da reavaliação de 90 dias.
// A mesma definição desenha o formulário, valida no servidor e monta a
// comparação no admin. O banco guarda { id_da_pergunta: resposta }.

import { DOR, FATURAMENTO, PERFIL, UFS, type Opcao } from '@/lib/opcoes'

export type TipoPergunta = 'texto' | 'area' | 'numero' | 'moeda' | 'whatsapp' | 'unica' | 'multipla' | 'escala' | 'uf' | 'aceite'

export type Pergunta = {
  id: string
  rotulo: string
  tipo: TipoPergunta
  opcoes?: Opcao[]
  obrigatorio?: boolean
  max?: number
  ajuda?: string
  placeholder?: string
  /** Só aparece (e só é validada) quando a condição bate. */
  se?: { id: string; igual?: string; inclui?: string }
}

export type Etapa = { titulo: string; perguntas: Pergunta[] }

const o = (pares: [string, string][]): Opcao[] => pares.map(([valor, rotulo]) => ({ valor, rotulo }))

export const TEMPO_CADEIRA = o([
  ['dia_todo', 'O dia todo'],
  ['mais_metade', 'Mais da metade do dia'],
  ['metade', 'Metade'],
  ['pouco', 'Pouco'],
  ['nao_corto', 'Não corto mais'],
])
export const OCUPACAO = o([
  ['lt40', 'Menos de 40%'],
  ['40a60', '40 a 60%'],
  ['60a80', '60 a 80%'],
  ['gt80', 'Mais de 80%'],
  ['nao_sei', 'Não sei'],
])
export const FREQ_NUMEROS = o([
  ['dia', 'Todo dia'],
  ['semana', 'Toda semana'],
  ['mes', 'Todo mês'],
  ['nunca', 'Quase nunca'],
])
export const REGRAS = o([
  ['sim', 'Sim'],
  ['nao', 'Não'],
  ['mais_menos', 'Mais ou menos'],
])
export const REUNIAO = o([
  ['semanal', 'Toda semana'],
  ['as_vezes', 'De vez em quando'],
  ['nao_faz', 'Não faço'],
  ['sem_equipe', 'Não tenho equipe'],
])
export const SIM_NAO = o([
  ['sim', 'Sim'],
  ['nao', 'Não'],
])
export const ASSINATURA = o([
  ['sim', 'Sim'],
  ['nao', 'Não'],
  ['parou', 'Já tive e parei'],
])

export const ETAPAS_ENTRADA: Etapa[] = [
  {
    titulo: 'Você e a barbearia',
    perguntas: [
      { id: 'nome', rotulo: 'Seu nome', tipo: 'texto', obrigatorio: true },
      { id: 'whatsapp', rotulo: 'WhatsApp', tipo: 'whatsapp', obrigatorio: true },
      { id: 'barbearia', rotulo: 'Nome da barbearia', tipo: 'texto' },
      { id: 'cidade', rotulo: 'Cidade', tipo: 'texto' },
      { id: 'uf', rotulo: 'Estado', tipo: 'uf' },
      {
        id: 'tamanho_cidade',
        rotulo: 'Tamanho da cidade',
        tipo: 'unica',
        opcoes: o([
          ['ate20', 'Até 20 mil'],
          ['20a50', '20 a 50 mil'],
          ['50a100', '50 a 100 mil'],
          ['100a200', '100 a 200 mil'],
          ['200mais', 'Mais de 200 mil'],
        ]),
      },
      {
        id: 'tempo_barbearia',
        rotulo: 'Há quanto tempo tem a barbearia',
        tipo: 'unica',
        opcoes: o([
          ['lt1', 'Menos de 1 ano'],
          ['1a3', '1 a 3 anos'],
          ['3a5', '3 a 5 anos'],
          ['5mais', 'Mais de 5 anos'],
        ]),
      },
      { id: 'funcionamento', rotulo: 'Dias e horário de funcionamento', tipo: 'texto', placeholder: 'Ex.: terça a sábado, 9h às 19h' },
    ],
  },
  {
    titulo: 'Equipe',
    perguntas: [
      { id: 'perfil', rotulo: 'Você trabalha', tipo: 'unica', opcoes: PERFIL, obrigatorio: true },
      { id: 'num_barbeiros', rotulo: 'Quantos barbeiros, contando você', tipo: 'numero' },
      {
        id: 'outras_funcoes',
        rotulo: 'Outras funções na barbearia',
        tipo: 'multipla',
        opcoes: o([
          ['recepcionista', 'Recepcionista'],
          ['ajudante', 'Ajudante'],
          ['gerente', 'Gerente ou líder'],
          ['nenhuma', 'Nenhuma'],
        ]),
      },
      {
        id: 'modelo_equipe',
        rotulo: 'Modelo da equipe',
        tipo: 'unica',
        opcoes: o([
          ['pj', 'Salão parceiro PJ'],
          ['clt', 'CLT'],
          ['aluguel', 'Aluguel de cadeira'],
          ['informal', 'Informal'],
          ['nenhuma', 'Não tenho equipe'],
        ]),
      },
      { id: 'comissao', rotulo: 'Comissão do barbeiro', tipo: 'texto', placeholder: 'Ex.: 50% no serviço, 10% no produto' },
      { id: 'tempo_cadeira', rotulo: 'Quanto tempo por dia você fica na cadeira', tipo: 'unica', opcoes: TEMPO_CADEIRA },
      { id: 'convivio', rotulo: 'Convívio da equipe', tipo: 'escala', ajuda: '1 = ruim · 5 = ótimo' },
      { id: 'cultura', rotulo: 'Como é a cultura da sua equipe', tipo: 'area' },
    ],
  },
  {
    titulo: 'Números',
    perguntas: [
      { id: 'faturamento', rotulo: 'Faturamento médio por mês', tipo: 'unica', opcoes: FATURAMENTO },
      { id: 'custo_fixo', rotulo: 'Custo fixo mensal', tipo: 'moeda' },
      { id: 'ocupacao', rotulo: 'Ocupação da agenda', tipo: 'unica', opcoes: OCUPACAO },
      { id: 'preco_corte', rotulo: 'Valor do corte', tipo: 'moeda' },
      { id: 'preco_barba', rotulo: 'Valor da barba', tipo: 'moeda' },
      { id: 'preco_combo', rotulo: 'Valor do cabelo + barba', tipo: 'moeda' },
      {
        id: 'formas_pagamento',
        rotulo: 'Formas de pagamento que aceita',
        tipo: 'multipla',
        opcoes: o([
          ['pix', 'Pix'],
          ['cartao', 'Cartão'],
          ['dinheiro', 'Dinheiro'],
          ['link', 'Link de pagamento'],
        ]),
      },
      { id: 'freq_numeros', rotulo: 'Com que frequência você olha os números', tipo: 'unica', opcoes: FREQ_NUMEROS },
    ],
  },
  {
    titulo: 'Gestão',
    perguntas: [
      {
        id: 'agendamento',
        rotulo: 'Sistema de agendamento',
        tipo: 'unica',
        opcoes: o([
          ['sistema', 'Uso sistema'],
          ['papel', 'Agenda no papel'],
          ['whatsapp', 'Pelo WhatsApp'],
          ['nao_usa', 'Não uso'],
        ]),
      },
      { id: 'agendamento_qual', rotulo: 'Qual sistema?', tipo: 'texto', se: { id: 'agendamento', igual: 'sistema' } },
      { id: 'regras_escritas', rotulo: 'Tem as regras da casa escritas?', tipo: 'unica', opcoes: REGRAS },
      { id: 'reuniao', rotulo: 'Faz reunião de equipe?', tipo: 'unica', opcoes: REUNIAO },
      { id: 'checklist', rotulo: 'Tem checklist de abertura e fechamento?', tipo: 'unica', opcoes: SIM_NAO },
    ],
  },
  {
    titulo: 'Assinatura',
    perguntas: [
      { id: 'assinatura', rotulo: 'Tem plano de assinatura?', tipo: 'unica', opcoes: ASSINATURA },
      { id: 'assinantes', rotulo: 'Quantos assinantes ativos', tipo: 'numero', se: { id: 'assinatura', igual: 'sim' } },
      { id: 'planos_assinatura', rotulo: 'Quais planos e preços', tipo: 'area', se: { id: 'assinatura', igual: 'sim' } },
    ],
  },
  {
    titulo: 'Objetivos',
    perguntas: [
      { id: 'dores', rotulo: 'Maior dor hoje (até 3)', tipo: 'multipla', opcoes: DOR, max: 3 },
      { id: 'dor_outro', rotulo: 'Qual outra dor?', tipo: 'texto', se: { id: 'dores', inclui: 'outro' } },
      { id: 'objetivo_90', rotulo: 'O que você quer resolvido em 90 dias', tipo: 'area' },
      { id: 'objetivo_12m', rotulo: 'Onde você quer chegar em 12 meses', tipo: 'area' },
      { id: 'autoriza', rotulo: 'Autorizo o uso dessas informações apenas dentro da mentoria MDC', tipo: 'aceite', obrigatorio: true },
    ],
  },
]

export const ETAPAS_90DIAS: Etapa[] = [
  {
    titulo: 'Reavaliação de 90 dias',
    perguntas: [
      { id: 'tempo_cadeira', rotulo: 'Quanto tempo por dia você fica na cadeira', tipo: 'unica', opcoes: TEMPO_CADEIRA },
      { id: 'faturamento', rotulo: 'Faturamento médio por mês', tipo: 'unica', opcoes: FATURAMENTO },
      { id: 'ocupacao', rotulo: 'Ocupação da agenda', tipo: 'unica', opcoes: OCUPACAO },
      { id: 'freq_numeros', rotulo: 'Com que frequência você olha os números', tipo: 'unica', opcoes: FREQ_NUMEROS },
    ],
  },
  {
    titulo: 'Gestão e assinatura',
    perguntas: [
      { id: 'regras_escritas', rotulo: 'Tem as regras da casa escritas?', tipo: 'unica', opcoes: REGRAS },
      { id: 'reuniao', rotulo: 'Faz reunião de equipe?', tipo: 'unica', opcoes: REUNIAO },
      { id: 'checklist', rotulo: 'Tem checklist de abertura e fechamento?', tipo: 'unica', opcoes: SIM_NAO },
      { id: 'assinatura', rotulo: 'Tem plano de assinatura?', tipo: 'unica', opcoes: ASSINATURA },
      { id: 'assinantes', rotulo: 'Quantos assinantes ativos', tipo: 'numero', se: { id: 'assinatura', igual: 'sim' } },
    ],
  },
  {
    titulo: 'O que mudou',
    perguntas: [{ id: 'o_que_mudou', rotulo: 'O que mudou na sua barbearia?', tipo: 'area', obrigatorio: true }],
  },
]

export const UFS_OPCOES: Opcao[] = UFS.map((u) => ({ valor: u, rotulo: u }))

export type Respostas = Record<string, string | string[] | boolean | number | null>

export function visivel(p: Pergunta, r: Respostas): boolean {
  if (!p.se) return true
  const v = r[p.se.id]
  if (p.se.igual !== undefined) return v === p.se.igual
  if (p.se.inclui !== undefined) return Array.isArray(v) && v.includes(p.se.inclui)
  return true
}

function vazio(v: unknown) {
  return v === undefined || v === null || v === '' || v === false || (Array.isArray(v) && v.length === 0)
}

/** Valida uma etapa. Devolve { id: mensagem }. */
export function validarEtapa(etapa: Etapa, r: Respostas): Record<string, string> {
  const erros: Record<string, string> = {}
  for (const p of etapa.perguntas) {
    if (!visivel(p, r)) continue
    const v = r[p.id]
    if (p.obrigatorio && vazio(v)) {
      erros[p.id] = p.tipo === 'aceite' ? 'Precisa marcar pra continuar.' : 'Campo obrigatório.'
      continue
    }
    if (vazio(v)) continue
    if (p.tipo === 'whatsapp') {
      const d = String(v).replace(/\D/g, '')
      if (d.length < 10 || d.length > 11) erros[p.id] = 'Coloca o WhatsApp com DDD.'
    }
    if ((p.tipo === 'unica' || p.tipo === 'uf') && !(p.opcoes ?? UFS_OPCOES).some((o) => o.valor === v)) erros[p.id] = 'Opção inválida.'
    if (p.tipo === 'multipla') {
      if (!Array.isArray(v) || !v.every((x) => p.opcoes?.some((o) => o.valor === x))) erros[p.id] = 'Opção inválida.'
      else if (p.max && v.length > p.max) erros[p.id] = `Escolhe no máximo ${p.max}.`
    }
    if (p.tipo === 'numero' && !/^\d{1,6}$/.test(String(v))) erros[p.id] = 'Só números.'
    if (p.tipo === 'moeda' && !/^\d{1,9}([.,]\d{1,2})?$/.test(String(v).replace(/\./g, '').replace(/^R\$\s?/, ''))) erros[p.id] = 'Valor inválido.'
    if (p.tipo === 'escala' && !['1', '2', '3', '4', '5'].includes(String(v))) erros[p.id] = 'Escolhe de 1 a 5.'
    if ((p.tipo === 'texto' || p.tipo === 'area') && String(v).length > (p.tipo === 'area' ? 3000 : 300)) erros[p.id] = 'Texto muito longo.'
  }
  return erros
}

/** Mantém só as respostas das perguntas conhecidas e visíveis. */
export function limparRespostas(etapas: Etapa[], r: Respostas): Respostas {
  const out: Respostas = {}
  for (const e of etapas) for (const p of e.perguntas) {
    if (!visivel(p, r) || vazio(r[p.id])) continue
    const v = r[p.id]
    out[p.id] = typeof v === 'string' ? v.trim() : v
  }
  return out
}

/** Resposta legível para o admin. */
export function respostaLegivel(p: Pergunta, v: unknown): string {
  if (vazio(v)) return '—'
  if (p.tipo === 'aceite') return 'Sim'
  if (p.tipo === 'moeda') return `R$ ${v}`
  if (p.opcoes) {
    const lista = Array.isArray(v) ? v : [v]
    return lista.map((x) => p.opcoes!.find((o) => o.valor === x)?.rotulo ?? String(x)).join(', ')
  }
  return String(v)
}
