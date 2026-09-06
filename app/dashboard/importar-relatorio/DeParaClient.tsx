'use client'

import { useState, useTransition } from 'react'
import { confirmarDePara, ignorarNome, reabrirDePara, vincularNomeManual } from './actions'
import type { LinhaDePara } from './page'

interface Props {
  linhas: LinhaDePara[]
  barbeiros: { id: string; nome: string }[]
}

const fmtData = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' })
  } catch { return '' }
}

export default function DeParaClient({ linhas, barbeiros }: Props) {
  const [erro, setErro] = useState<string | null>(null)
  const [escolha, setEscolha] = useState<Record<string, string>>({})
  const [novoNome, setNovoNome] = useState('')
  const [novoBarbeiro, setNovoBarbeiro] = useState('')
  const [isPending, startTransition] = useTransition()

  // Pendentes primeiro, e dentro delas o nome que mais aparece — é o que está
  // custando faturamento todo dia.
  const pendentes = linhas
    .filter(l => !l.barbeiroId && !l.ignorar)
    .sort((a, b) => b.vezes - a.vezes)
  const resolvidas = linhas.filter(l => l.barbeiroId || l.ignorar)
  // Tabela inteiramente vazia = nenhuma importação passou por aqui ainda.
  const nuncaImportou = linhas.length === 0

  const nomeDoBarbeiro = (id: string | null) =>
    barbeiros.find(b => b.id === id)?.nome ?? 'profissional removido'

  function rodar(acao: () => Promise<{ ok?: boolean; error?: string }>) {
    setErro(null)
    startTransition(async () => {
      const res = await acao()
      if (res?.error) setErro(res.error)
    })
  }

  return (
    <div className="space-y-6">
      {erro && (
        <p className="rounded-xl border border-red-400/30 bg-red-400/[0.06] px-4 py-3 text-sm text-red-200">{erro}</p>
      )}

      {/* Pendentes */}
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl text-text">Falta confirmar</h2>
            <p className="mt-1 text-sm text-text-muted">
              {pendentes.length > 0
                ? `${pendentes.length} nome${pendentes.length === 1 ? '' : 's'} do relatório sem correspondência.`
                : nuncaImportou
                // Dizer "tudo reconhecido" aqui seria mentira: nenhuma
                // importação passou por esta tela ainda, então não há o que
                // reconhecer. As duas situações parecem iguais na tela e são
                // opostas na prática.
                ? 'Nenhuma importação registrou nomes aqui ainda.'
                : 'Nenhum nome pendente — a última importação foi toda reconhecida.'}
            </p>
          </div>
        </div>

        {pendentes.length === 0 && nuncaImportou && (
          <div className="mt-4 rounded-xl border border-border bg-surface-2 p-4 text-sm leading-relaxed text-text-muted">
            Os nomes chegam sozinhos: <strong className="text-text">rode uma importação pela
            extensão</strong> e todo nome que o BarberMeta não reconhecer aparece aqui.
            Se você já sabe qual nome vai dar problema, pode adiantar no campo abaixo.
          </div>
        )}

        {pendentes.length > 0 && (
          <div className="mt-5 space-y-3">
            {pendentes.map(l => (
              <div key={l.nomeOrigem} className="rounded-xl border border-amber-400/25 bg-amber-400/[0.04] p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <strong className="text-text">{l.nomeExibicao}</strong>
                  <span className="text-xs text-text-muted">
                    apareceu {l.vezes}× · última vez {fmtData(l.vistoEm)}
                  </span>
                </div>

                {barbeiros.length === 0 ? (
                  <p className="mt-3 text-sm text-text-muted">
                    Você ainda não tem barbeiro ativo cadastrado. Cadastre em Configurações → Equipe
                    para poder vincular.
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select
                      value={escolha[l.nomeOrigem] ?? ''}
                      onChange={e => setEscolha(s => ({ ...s, [l.nomeOrigem]: e.target.value }))}
                      className="input flex-1 text-sm"
                      aria-label={`Quem é ${l.nomeExibicao} no BarberMeta`}
                    >
                      <option value="">É quem no BarberMeta?</option>
                      {barbeiros.map(b => (
                        <option key={b.id} value={b.id}>{b.nome}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => rodar(() => confirmarDePara(l.nomeOrigem, escolha[l.nomeOrigem]))}
                      disabled={isPending || !escolha[l.nomeOrigem]}
                      className="btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => rodar(() => ignorarNome(l.nomeOrigem))}
                      disabled={isPending}
                      className="btn-ghost border border-border text-sm"
                    >
                      Não é ninguém
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Adiantar um nome, sem esperar a próxima importação */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-serif text-xl text-text">Adiantar um nome</h2>
        <p className="mt-1 text-sm leading-relaxed text-text-muted">
          Digite o nome <strong className="text-text">exatamente como aparece no relatório do
          Agenda Serviço</strong> e diga quem é. Acento e maiúscula não importam; o resto sim.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input
            value={novoNome}
            onChange={e => setNovoNome(e.target.value)}
            placeholder="Nome no Agenda Serviço"
            maxLength={200}
            className="input flex-1 text-sm"
            aria-label="Nome como aparece no relatório do Agenda Serviço"
          />
          <select
            value={novoBarbeiro}
            onChange={e => setNovoBarbeiro(e.target.value)}
            className="input flex-1 text-sm"
            aria-label="Quem é esse nome no BarberMeta"
          >
            <option value="">É quem no BarberMeta?</option>
            {barbeiros.map(b => (
              <option key={b.id} value={b.id}>{b.nome}</option>
            ))}
            <option value="__ninguem__">— Não é ninguém (total, serviço avulso…)</option>
          </select>
          <button
            onClick={() => rodar(async () => {
              const res = await vincularNomeManual(
                novoNome,
                novoBarbeiro === '__ninguem__' ? null : novoBarbeiro,
              )
              if (res?.ok) { setNovoNome(''); setNovoBarbeiro('') }
              return res
            })}
            disabled={isPending || !novoNome.trim() || !novoBarbeiro}
            className="btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Salvar
          </button>
        </div>
      </section>

      {/* Já resolvidos */}
      {resolvidas.length > 0 && (
        <section className="card p-5 sm:p-6">
          <h2 className="font-serif text-xl text-text">Já confirmados</h2>
          <p className="mt-1 text-sm text-text-muted">
            Estes o BarberMeta já reconhece sozinho em toda importação.
          </p>
          <div className="mt-4 space-y-2">
            {resolvidas.map(l => (
              <div
                key={l.nomeOrigem}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3"
              >
                <span className="min-w-0 text-sm">
                  <strong className="text-text">{l.nomeExibicao}</strong>
                  <span className="text-text-muted">
                    {l.ignorar ? ' — marcado como "não é ninguém"' : ` → ${nomeDoBarbeiro(l.barbeiroId)}`}
                  </span>
                </span>
                <button
                  onClick={() => rodar(() => reabrirDePara(l.nomeOrigem))}
                  disabled={isPending}
                  className="text-xs text-text-muted transition-colors hover:text-primary"
                >
                  Desfazer
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="px-1 text-xs leading-relaxed text-text-muted">
        Os nomes chegam aqui sozinhos: sempre que a extensão manda um relatório com alguém que o
        BarberMeta não reconhece, ele entra nesta lista. Confirmar aqui não renomeia ninguém — o
        nome no ranking, no card de pagamento e na tela do barbeiro continua o que você escolheu.
      </p>
    </div>
  )
}
