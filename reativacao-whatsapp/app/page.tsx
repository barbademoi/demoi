'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Uploader from '@/components/Uploader'
import ConfigIA from '@/components/ConfigIA'
import ClienteRow from '@/components/ClienteRow'
import type { ClienteComDias } from '@/lib/types-cliente'

export default function Page() {
  const [clientes, setClientes] = useState<ClienteComDias[]>([])
  const [totalBase, setTotalBase] = useState(0)
  const [diasMin, setDiasMin] = useState(30)
  const [ocultarContatados, setOcultarContatados] = useState(true)
  const [instrucaoBase, setInstrucaoBase] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Histórico das últimas mensagens geradas nesta sessão, só pra pedir
  // pra IA variar a abertura/estrutura entre clientes.
  const mensagensSessao = useRef<string[]>([])

  const carregarClientes = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const params = new URLSearchParams({
        diasMin: String(diasMin),
        ocultarContatados: String(ocultarContatados),
      })
      const resp = await fetch(`/api/clientes?${params}`)
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.erro || 'Erro ao carregar clientes.')
      setClientes(data.clientes)
      setTotalBase(data.total)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar clientes.')
    } finally {
      setCarregando(false)
    }
  }, [diasMin, ocultarContatados])

  useEffect(() => {
    carregarClientes()
  }, [carregarClientes])

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((cfg) => setInstrucaoBase(cfg.instrucaoBase ?? ''))
  }, [])

  async function gerarMensagem(nome: string, diasSemCortar: number): Promise<string> {
    const resp = await fetch('/api/mensagem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome,
        diasSemCortar,
        instrucaoBase,
        mensagensAnteriores: mensagensSessao.current,
      }),
    })
    const data = await resp.json()
    if (!resp.ok) throw new Error(data.erro || 'Erro ao gerar mensagem.')
    mensagensSessao.current = [...mensagensSessao.current, data.mensagem].slice(-8)
    return data.mensagem as string
  }

  async function marcarContatado(id: string, contatado: boolean) {
    const resp = await fetch('/api/contatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, contatado }),
    })
    if (!resp.ok) throw new Error('Erro ao marcar contato.')
    await carregarClientes()
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 pb-16">
      <header>
        <h1 className="text-2xl font-bold">Reativação de clientes via WhatsApp</h1>
        <p className="text-sm text-neutral-400">
          Ferramenta pessoal — envio 100% semi-manual. Nada é enviado automaticamente: cada mensagem é aberta no
          WhatsApp pra você revisar e enviar.
        </p>
      </header>

      <Uploader onImportado={carregarClientes} />

      <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
        <h2 className="mb-2 text-lg font-semibold">2. Filtro</h2>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            Clientes sem cortar há pelo menos
            <input
              type="number"
              min={0}
              value={diasMin}
              onChange={(e) => setDiasMin(Number(e.target.value) || 0)}
              className="w-20 rounded border border-neutral-700 bg-neutral-950 p-1 text-center"
            />
            dias
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={ocultarContatados}
              onChange={(e) => setOcultarContatados(e.target.checked)}
            />
            Esconder já contatados
          </label>
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          {totalBase} clientes na base • {clientes.length} na lista de reativação
        </p>
      </div>

      <ConfigIA instrucaoBase={instrucaoBase} onChange={setInstrucaoBase} />

      <div>
        <h2 className="mb-2 text-lg font-semibold">4. Lista de reativação</h2>
        {carregando && <p className="text-sm text-neutral-400">Carregando...</p>}
        {erro && <p className="text-sm text-red-400">{erro}</p>}
        {!carregando && clientes.length === 0 && (
          <p className="text-sm text-neutral-500">
            Nenhum cliente nessa condição. Importe uma planilha ou ajuste o filtro de dias.
          </p>
        )}
        <div className="space-y-3">
          {clientes.map((cliente) => (
            <ClienteRow
              key={cliente.id}
              cliente={cliente}
              instrucaoBase={instrucaoBase}
              onGerarMensagem={gerarMensagem}
              onMarcarContatado={marcarContatado}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
