import { Gift, Share2, Pencil, Check, Archive, Trash2, Home, Users, Inbox, Menu, Plus, Star } from 'lucide-react'

// Mock do print "Feedbacks de Clientes" do gestor. Mostra dois cards de
// feedback (5 estrelas, badge NOVO, comentário, brinde sorteado com código
// e ações). Pensado pra encaixar dentro do PhoneFrame.
export function FeedbackClienteMock() {
  return (
    <div className="w-full h-full bg-areia overflow-hidden flex flex-col text-preto">
      {/* HEADER */}
      <div className="px-3 pt-3 pb-2 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-linho border border-border flex items-center justify-center text-[8px] text-marrom font-bold">
          Demôi
        </div>
        <div className="leading-tight">
          <p className="font-serif text-[14px] text-preto">Bússola</p>
          <p className="text-[8px] text-chumbo">Demoi Barbearia</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-2 space-y-2">
        <FeedbackCard
          nome="Marcos Paulo Neves"
          atendido="Zé Lucas"
          comentario="Atendimento impecável, do início ao fim. Excelente profissional, com um serviço primoroso, além de te deixar confortável."
          brinde="20% OFF na Hidratação Capilar Térmica!"
          codigo="8J9542"
        />
        <FeedbackCard
          nome="Gabriel Francisco"
          atendido="Caique"
          comentario="Ele é gente boa faz um bom trabalho e é um dos melhores pra cortar."
          brinde="10% OFF na Limpeza de Pele!"
          codigo="9DPRDV"
        />
      </div>

      {/* BOTTOM NAV */}
      <div className="relative h-10 bg-surface border-t border-border flex items-center justify-around px-2">
        <NavItem icon={Home} label="Início" />
        <NavItem icon={Users} label="Colab." />
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-marrom flex items-center justify-center shadow-md">
          <Plus size={16} strokeWidth={2} color="#FFFFFF" />
        </div>
        <span className="w-9" aria-hidden />
        <NavItem icon={Inbox} label="Ativ." />
        <NavItem icon={Menu} label="Mais" />
      </div>
    </div>
  )
}

function FeedbackCard({
  nome,
  atendido,
  comentario,
  brinde,
  codigo,
}: {
  nome: string
  atendido: string
  comentario: string
  brinde: string
  codigo: string
}) {
  return (
    <div className="rounded-lg bg-surface border border-border p-2.5">
      <div className="flex items-center justify-between mb-1">
        <span className="inline-flex gap-px">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={8} strokeWidth={1.5} fill="#8B6F47" color="#8B6F47" />
          ))}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[7px] text-chumbo">há 17 min</span>
          <span className="text-[7px] text-white bg-marrom rounded-full px-1.5 py-0.5 font-semibold">NOVO</span>
        </div>
      </div>
      <p className="text-[9px] font-semibold text-text">{nome}</p>
      <p className="text-[7px] text-chumbo mb-1">Atendido por <span className="text-text font-medium">{atendido}</span></p>
      <p className="text-[7px] text-grafite border-l-2 border-border pl-1.5 italic leading-snug line-clamp-3">
        {comentario}
      </p>

      <div className="mt-1.5 rounded-md bg-linho border border-marrom/30 p-1.5">
        <p className="inline-flex items-center gap-1 text-[7px] text-marrom font-semibold leading-tight">
          <Gift size={8} strokeWidth={1.5} /> Brinde sorteado: {brinde}
        </p>
        <p className="text-[6px] text-chumbo mt-0.5">
          Código: <span className="font-mono font-bold text-text">{codigo}</span>
        </p>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[6px] text-marrom">
        <span className="inline-flex items-center gap-0.5"><Share2 size={7} strokeWidth={1.5} /> Compartilhar</span>
        <span className="inline-flex items-center gap-0.5"><Pencil size={7} strokeWidth={1.5} /> Observação</span>
        <span className="inline-flex items-center gap-0.5 text-chumbo"><Check size={7} strokeWidth={1.5} /> Lido</span>
        <span className="inline-flex items-center gap-0.5 text-chumbo"><Archive size={7} strokeWidth={1.5} /> Arquivar</span>
        <span className="inline-flex items-center gap-0.5 text-vinho"><Trash2 size={7} strokeWidth={1.5} /> Excluir</span>
      </div>
    </div>
  )
}

function NavItem({ icon: Icon, label }: { icon: typeof Home; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-chumbo">
      <Icon size={12} strokeWidth={1.5} />
      <span className="text-[6px]">{label}</span>
    </div>
  )
}
