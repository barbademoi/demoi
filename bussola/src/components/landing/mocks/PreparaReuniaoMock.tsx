import { Sparkles, RotateCw, Star, Plus, Home, Users, Inbox, Menu } from 'lucide-react'

// Mock do print "Preparar Reunião + Resumo da IA + Feedbacks de cliente".
// Recriado em HTML/CSS pra ser leve, responsivo e atualizar junto com o app.
// Pensado pra encaixar dentro de PhoneFrame (aspect-ratio 9:19.5).
export function PreparaReuniaoMock() {
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

      {/* CARD PRÓXIMA REUNIÃO */}
      <div className="mx-2 mt-1 rounded-lg bg-surface border border-border p-3">
        <p className="text-[10px] text-preto font-medium">Preparar reunião</p>
        <p className="text-[8px] text-chumbo mb-2">Segunda-feira, 14:00</p>
        <p className="font-serif text-[15px] text-marrom font-bold leading-tight">
          42 observações desde a última reunião (1 de junho)
        </p>
      </div>

      {/* RESUMO DA IA */}
      <div className="mx-2 mt-2 rounded-lg bg-linho border-l-[3px] border-marrom p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <p className="inline-flex items-center gap-1 text-[9px] font-semibold text-marrom">
            <Sparkles size={10} strokeWidth={1.8} /> Resumo da semana pela IA
          </p>
          <span className="inline-flex items-center gap-0.5 text-[8px] text-marrom">
            <RotateCw size={8} strokeWidth={1.8} /> Atualizar
          </span>
        </div>
        <p className="text-[8px] text-grafite italic leading-snug">
          A semana foi sensacional pra equipe! Zé Lucas, Rael e Ryan brilharam no
          atendimento com feedbacks incríveis dos clientes, enquanto Zé ainda
          conseguiu conduzir bem um curso de barbeiros e a galera começou a
          vender hidratações capilares com a gamificação.
        </p>
      </div>

      {/* FEEDBACK CLIENTES */}
      <div className="mx-2 mt-2 rounded-lg bg-surface border border-border p-2.5 flex-1 overflow-hidden">
        <p className="inline-flex items-center gap-1 text-[9px] font-semibold text-text">
          <Star size={10} strokeWidth={1.5} fill="#8B6F47" color="#8B6F47" />
          Feedback de clientes ainda não tratados
        </p>
        <p className="text-[7px] text-chumbo mt-0.5">
          47 feedbacks · 5.0 estrelas em média · 4 com comentário
        </p>
        <div className="mt-1.5 space-y-1.5 text-[8px]">
          <p className="text-text">
            <Estrelas /> <span className="italic text-grafite">&ldquo;ótimos profissionais&rdquo;</span>
          </p>
          <p className="text-text">
            <Estrelas /> <span className="italic text-grafite">&ldquo;Simplesmente a melhor barbearia da cidade.&rdquo;</span>
          </p>
          <p className="text-text">
            <Estrelas /> <span className="italic text-grafite">&ldquo;Todos sao excelentes!&rdquo;</span>
          </p>
        </div>
      </div>

      {/* BOTTOM NAV */}
      <div className="relative h-10 bg-surface border-t border-border flex items-center justify-around px-2 mt-1">
        <NavItem icon={Home} label="Início" />
        <NavItem icon={Users} label="Colaboradores" />
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-marrom flex items-center justify-center shadow-md">
          <Plus size={16} strokeWidth={2} color="#FFFFFF" />
        </div>
        <span className="w-9" aria-hidden />
        <NavItem icon={Inbox} label="Atividade" />
        <NavItem icon={Menu} label="Mais" />
      </div>
    </div>
  )
}

function Estrelas() {
  return (
    <span className="inline-flex align-middle gap-px mr-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={7} strokeWidth={1.5} fill="#8B6F47" color="#8B6F47" />
      ))}
    </span>
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
