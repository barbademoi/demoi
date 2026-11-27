'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Logo } from '@/components/tarefix/Logo'

/**
 * Apresentação do Tarefix dentro do BarberMeta: um passo a passo curto do que
 * o módulo faz, com uma "tela de celular" ilustrando cada parte. Usada pelo
 * popup de lançamento e pelo botão "Ver como funciona" da página de compra.
 */

const ROXO = '#5B3DF5'

type Passo = { titulo: string; texto: ReactNode; tela: ReactNode }

function Celular({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-[210px] rounded-[28px] border-[6px] border-[#26233a] bg-[#f4f3f8] p-3 text-left text-[#17152b] shadow-2xl">
      <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-[#26233a]/30" />
      {children}
    </div>
  )
}

function Linha({ feito, texto, extra }: { feito?: boolean; texto: string; extra?: string }) {
  return (
    <div className="mb-1.5 flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 text-[11px] font-bold shadow-sm">
      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border-2 text-[9px] text-white ${feito ? 'border-transparent' : 'border-[#c9c6da]'}`} style={feito ? { background: ROXO } : undefined}>
        {feito ? '✓' : ''}
      </span>
      <span className={`flex-1 truncate ${feito ? 'text-[#8a87a0] line-through' : ''}`}>{texto}</span>
      {extra && <span className="text-[9px] text-[#8a87a0]">{extra}</span>}
    </div>
  )
}

function Barra({ pct, rotulo }: { pct: number; rotulo: string }) {
  return (
    <div className="mb-2">
      <div className="mb-1 flex justify-between text-[10px] font-extrabold">
        <span>{rotulo}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#e4e2ee]">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: ROXO }} />
      </div>
    </div>
  )
}

const PASSOS: Passo[] = [
  {
    titulo: 'A rotina da barbearia, no celular da equipe',
    texto: (
      <>
        O Tarefix organiza as <b>tarefas do dia a dia</b>: abrir a barbearia, limpar as bancadas, repor produtos, postar nos stories, conferir a agenda… Cada colaborador
        recebe um <b>link próprio com PIN</b> e vê só as tarefas dele. <b>Não precisa baixar aplicativo.</b>
      </>
    ),
    tela: (
      <Celular>
        <p className="text-[10px] font-bold text-[#6b6880]">Bom dia, Lucas 👋</p>
        <p className="mb-2 text-sm font-extrabold">Suas tarefas de hoje</p>
        <Linha feito texto="Abrir e ligar o ar" extra="08:00" />
        <Linha feito texto="Limpar bancadas" extra="08:15" />
        <Linha texto="Repor pomadas" extra="10:00" />
        <Linha texto="Story do corte" extra="15:00" />
      </Celular>
    ),
  },
  {
    titulo: 'Você monta as tarefas uma vez só',
    texto: (
      <>
        Crie a tarefa, escolha <b>quem faz</b>, <b>em quais dias</b> e <b>até que horas</b>. Ela se repete sozinha. Dá para colocar <b>checklist</b> (passo a passo) e pedir{' '}
        <b>foto de prova</b>: “mande a foto da bancada limpa”.
      </>
    ),
    tela: (
      <Celular>
        <p className="mb-2 text-sm font-extrabold">Nova tarefa</p>
        <div className="mb-1.5 rounded-xl bg-white px-2.5 py-2 text-[11px] font-bold shadow-sm">Limpar e organizar a bancada</div>
        <div className="mb-1.5 flex gap-1">
          {['S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
            <span key={i} className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-extrabold text-white" style={{ background: ROXO }}>
              {d}
            </span>
          ))}
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-extrabold text-[#8a87a0]">D</span>
        </div>
        <div className="mb-1.5 rounded-xl bg-white px-2.5 py-2 text-[11px] font-bold shadow-sm">⏰ Até 09:00 · 📷 Foto de prova</div>
        <div className="rounded-xl py-2 text-center text-[11px] font-extrabold text-white" style={{ background: ROXO }}>
          Salvar tarefa
        </div>
      </Celular>
    ),
  },
  {
    titulo: 'Você acompanha tudo em tempo real',
    texto: (
      <>
        No painel <b>“Hoje”</b> você vê <b>quem já fez, quem está atrasado</b> e a <b>% do dia</b> de cada um. As fotos chegam para você <b>aprovar ou devolver</b> com o motivo.
        Sem precisar ficar cobrando no grupo.
      </>
    ),
    tela: (
      <Celular>
        <p className="mb-2 text-sm font-extrabold">Hoje na equipe</p>
        <Barra rotulo="Lucas" pct={100} />
        <Barra rotulo="Rafa" pct={75} />
        <Barra rotulo="Bia (recepção)" pct={40} />
        <div className="mt-2 rounded-xl bg-white px-2.5 py-2 text-[10px] font-bold shadow-sm">📷 Rafa mandou a foto da bancada · Aprovar?</div>
      </Celular>
    ),
  },
  {
    titulo: 'Bônus por desempenho (opcional)',
    texto: (
      <>
        Quer premiar quem cumpre? Ligue o <b>bônus</b>: por exemplo, <b>90% das tarefas no mês = R$ 50</b> e <b>100% = R$ 100</b>. O colaborador acompanha o próprio
        termômetro e se motiva sozinho. No fechamento do mês o sistema mostra quem bateu.
      </>
    ),
    tela: (
      <Celular>
        <p className="mb-1 text-sm font-extrabold">Seu mês</p>
        <p className="mb-2 text-[10px] font-bold text-[#6b6880]">Faltam 4 dias para fechar</p>
        <Barra rotulo="Tarefas no prazo" pct={92} />
        <div className="rounded-xl bg-white p-2.5 text-[11px] font-bold shadow-sm">
          🏆 Você já garantiu <span style={{ color: ROXO }}>R$ 50</span>
          <br />
          <span className="text-[10px] text-[#6b6880]">Chegue a 100% e ganhe R$ 100</span>
        </div>
      </Celular>
    ),
  },
  {
    titulo: 'Lembretes no celular: ninguém esquece',
    texto: (
      <>
        Cada um recebe <b>notificação na hora da tarefa</b>, com botão de “feito”. Você recebe o <b>resumo do dia</b> e os avisos importantes. Dá até para colocar as tarefas
        na <b>agenda do celular</b>, com alarme 15 minutos antes.
      </>
    ),
    tela: (
      <Celular>
        <p className="mb-6 mt-3 text-center text-2xl font-extrabold">10:00</p>
        <div className="rounded-2xl bg-white/95 p-2.5 shadow-md">
          <p className="text-[9px] font-extrabold uppercase text-[#6b6880]">Tarefix · agora</p>
          <p className="text-[11px] font-extrabold">Hora de: Repor pomadas</p>
          <div className="mt-1.5 flex gap-1.5">
            <span className="flex-1 rounded-lg py-1 text-center text-[10px] font-extrabold text-white" style={{ background: ROXO }}>
              ✓ Feito
            </span>
            <span className="flex-1 rounded-lg bg-[#e4e2ee] py-1 text-center text-[10px] font-extrabold">Adiar</span>
          </div>
        </div>
      </Celular>
    ),
  },
  {
    titulo: 'E o “Meu dia”: as suas tarefas de dono',
    texto: (
      <>
        Além da equipe, você tem a sua lista pessoal: <b>pagar fornecedor, ligar para o contador, conferir o caixa</b>… Com lembretes, checklist e a sequência de dias em que
        você cumpriu tudo. 🔥
      </>
    ),
    tela: (
      <Celular>
        <p className="mb-2 text-sm font-extrabold">Meu dia 🔥 6 dias</p>
        <Linha feito texto="Conferir o caixa" />
        <Linha texto="Pagar fornecedor" extra="14:00" />
        <Linha texto="Ligar p/ contador" />
        <div className="mt-1 rounded-xl border-2 border-dashed border-[#c9c6da] px-2.5 py-2 text-[11px] font-bold text-[#8a87a0]">+ Adicionar tarefa</div>
      </Celular>
    ),
  },
]

export default function TarefixApresentacao({
  aberto,
  aoFechar,
  rodape,
}: {
  aberto: boolean
  aoFechar: () => void
  /** Botões do último passo (ex.: comprar). */
  rodape?: ReactNode
}) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (aberto) setI(0)
  }, [aberto])
  useEffect(() => {
    if (!aberto) return
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    document.addEventListener('keydown', tecla)
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', tecla)
      document.body.style.overflow = antes
    }
  }, [aberto, aoFechar])
  if (!aberto) return null
  const p = PASSOS[i]
  const ultimo = i === PASSOS.length - 1

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 p-0 sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="tarefix-apresentacao-titulo">
      <div className="relative flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-[#5B3DF5]/40 bg-[#13111f] shadow-2xl sm:max-h-[92dvh] sm:rounded-3xl">
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20"
        >
          ×
        </button>

        <div className="overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(91,61,245,0.35),transparent_50%)] p-5 sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <Logo className="text-3xl" claro />
            <span className="rounded-full bg-[#5B3DF5] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">Novo no BarberMeta</span>
          </div>

          <div className="grid items-center gap-6 sm:grid-cols-[1fr_220px]">
            <div className="order-2 sm:order-1">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a797ff]">
                Passo {i + 1} de {PASSOS.length}
              </p>
              <h2 id="tarefix-apresentacao-titulo" className="mt-1 font-serif text-2xl leading-tight text-white sm:text-3xl">
                {p.titulo}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[#d4d1e6]">{p.texto}</p>
            </div>
            <div className="order-1 sm:order-2">{p.tela}</div>
          </div>

          <div className="mt-6 flex justify-center gap-1.5" aria-hidden>
            {PASSOS.map((_, n) => (
              <span key={n} className={`h-2 rounded-full transition-all ${n === i ? 'w-6 bg-[#5B3DF5]' : 'w-2 bg-white/25'}`} />
            ))}
          </div>

          {ultimo ? (
            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-[#5B3DF5]/40 bg-[#5B3DF5]/10 p-4 text-center">
                <p className="text-sm text-[#d4d1e6]">Tudo isso por</p>
                <p className="font-serif text-4xl text-white">R$ 47</p>
                <p className="text-sm text-[#a9a5c2]">pagamento único · sem mensalidade</p>
              </div>
              {rodape}
              <button type="button" onClick={() => setI(i - 1)} className="w-full py-2 text-center text-sm font-semibold text-[#a9a5c2] hover:text-white">
                ← Voltar
              </button>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-[auto_1fr] gap-3">
              <button
                type="button"
                onClick={() => (i === 0 ? aoFechar() : setI(i - 1))}
                className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
              >
                {i === 0 ? 'Agora não' : '←'}
              </button>
              <button type="button" onClick={() => setI(i + 1)} className="rounded-xl bg-[#5B3DF5] px-5 py-3 text-sm font-black text-white hover:brightness-110">
                {i === 0 ? 'Ver como funciona →' : 'Próximo →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
