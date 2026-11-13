import Link from 'next/link'
import { detalhePlacar } from '@/lib/tarefix/placarTexto'
import { exigirDono } from '@/lib/tarefix/dono'
import { anoMesDe, hojeSP, mesPorExtenso } from '@/lib/tarefix/datas'
import { carregarMesDono, mesesDisponiveis } from '@/lib/tarefix/mesDono'
import { Avatar, Titulo, Vazio } from '@/components/tarefix/ui'
import { Termometro } from '@/components/tarefix/Termometro'
import { BotaoFecharMes } from './BotaoFecharMes'

export const metadata = { title: 'Mês' }

const FUSO_FMT = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' })

export default async function Mes({ searchParams }: { searchParams: { m?: string } }) {
  const { db, empresa } = await exigirDono()
  const meses = mesesDisponiveis(empresa)
  const anoMes = searchParams.m && meses.includes(searchParams.m) ? searchParams.m : anoMesDe(hojeSP())
  const idx = meses.indexOf(anoMes)
  const anterior = meses[idx + 1]
  const proximo = idx > 0 ? meses[idx - 1] : undefined

  const resumo = await carregarMesDono(empresa, anoMes)
  const { count: extrasPendentes } = await db
    .from('extras')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pendente')
    .gte('data', `${anoMes}-01`)
    .lte('data', `${anoMes}-31`)

  return (
    <>
      <Titulo>Mês</Titulo>

      <div className="tf-cartao mb-5 flex items-center justify-between p-2">
        {anterior ? (
          <Link href={`/tarefix/painel/mes?m=${anterior}`} className="flex h-11 w-11 items-center justify-center rounded-full text-xl hover:bg-tf-marca-clara" aria-label="Mês anterior">‹</Link>
        ) : (
          <span className="h-11 w-11" />
        )}
        <span className="text-lg font-extrabold first-letter:uppercase">{mesPorExtenso(anoMes)}</span>
        {proximo ? (
          <Link href={`/tarefix/painel/mes?m=${proximo}`} className="flex h-11 w-11 items-center justify-center rounded-full text-xl hover:bg-tf-marca-clara" aria-label="Próximo mês">›</Link>
        ) : (
          <span className="h-11 w-11" />
        )}
      </div>

      {resumo.fechado && (
        <p className="mb-5 rounded-2xl bg-tf-texto px-4 py-3 text-sm font-bold text-tf-fundo">
          Mês fechado em {FUSO_FMT.format(new Date(resumo.fechado.fechado_em))}. Os valores abaixo são os finais e não mudam mais.
        </p>
      )}

      {resumo.linhas.length === 0 ? (
        <Vazio titulo="Nada neste mês" texto="Ninguém tinha tarefas neste mês." />
      ) : (
        <div className="space-y-5">
          {resumo.bonusAtivo && (
            <section className="tf-cartao p-5">
              <h2 className="mb-3 text-lg font-extrabold">Bônus</h2>
              <ul className="space-y-3">
                {[...resumo.niveis].reverse().map((n) => {
                  const acima = resumo.linhas.filter((l) => (l.placar?.percentual ?? 0) >= n.percentual)
                  return (
                    <li key={n.percentual} className="rounded-2xl border border-tf-borda p-4">
                      <div className="flex items-center justify-between font-extrabold">
                        <span>{n.percentual}% ou mais</span>
                        <span>{n.premio}</span>
                      </div>
                      <p className="mt-1 text-sm text-tf-suave">
                        {acima.length ? acima.map((l) => l.nome.split(' ')[0]).join(', ') : 'Ninguém ainda'}
                      </p>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          <ul className="space-y-3">
            {resumo.linhas.map((l) => (
              <li key={l.colaborador_id} className={`tf-cartao p-5 ${l.ativo ? '' : 'opacity-60'}`}>
                <div className="mb-3 flex items-center gap-3">
                  <Avatar nome={l.nome} url={l.foto_url} tamanho={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-extrabold">{l.nome}</p>
                    <p className="text-sm text-tf-suave">
                      {l.extrasAprovadas ? `+${l.extrasAprovadas} extra${l.extrasAprovadas > 1 ? 's' : ''} aprovada${l.extrasAprovadas > 1 ? 's' : ''}` : 'Sem extras aprovadas'}
                      {!l.ativo && ' · desativado'}
                    </p>
                  </div>
                </div>
                <Termometro
                  rotulo={resumo.atual ? 'No mês (dias fechados)' : 'No mês'}
                  percentual={l.placar?.percentual ?? null}
                  detalhe={l.placar && l.placar.total ? detalhePlacar(l.placar, '') : undefined}
                />
                {l.bonus && (
                  <p className="mt-3 text-sm font-bold">
                    {l.bonus.atingido ? `Bônus: ${l.bonus.atingido.premio}` : 'Sem bônus'}
                    {!resumo.fechado && l.bonus.proximo && l.bonus.falta !== null && (
                      <span className="font-medium text-tf-suave"> · faltam {l.bonus.falta}% para {l.bonus.proximo.premio}</span>
                    )}
                  </p>
                )}
              </li>
            ))}
          </ul>

          {!resumo.fechado && (
            <section className="tf-cartao space-y-3 p-5">
              <h2 className="text-lg font-extrabold">Fechar mês</h2>
              {resumo.atual ? (
                <p className="text-tf-suave">Disponível quando o mês terminar. Até lá, os números ainda mudam.</p>
              ) : (
                <>
                  <p className="text-tf-suave">Grava o percentual final, as extras aprovadas e o bônus de cada um. Depois disso nada deste mês pode ser alterado.</p>
                  {(extrasPendentes ?? 0) > 0 && (
                    <p className="rounded-xl bg-tf-marca-clara px-4 py-3 text-sm font-bold text-tf-marca-texto">
                      Há {extrasPendentes} extra{extrasPendentes! > 1 ? 's' : ''} deste mês esperando aprovação. Decida antes de fechar.
                    </p>
                  )}
                  <BotaoFecharMes anoMes={anoMes} rotuloMes={mesPorExtenso(anoMes)} />
                </>
              )}
            </section>
          )}
        </div>
      )}
    </>
  )
}
