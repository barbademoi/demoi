/**
 * DIVISOR TEMÁTICO ENTRE SEÇÕES.
 *
 * Um traço fino com um ícone de barbearia no meio — tesoura, navalha, pente ou
 * o poste listrado. É onde o vermelho do poste entra: em detalhe, no tamanho
 * de um ícone, sem disputar atenção com o CTA verde.
 *
 * `aria-hidden` porque é ornamento: quem usa leitor de tela não ganha nada
 * ouvindo "tesoura" entre duas seções.
 */

type Simbolo = 'tesoura' | 'navalha' | 'pente' | 'poste'

const CAMINHOS: Record<Simbolo, React.ReactNode> = {
  tesoura: (
    <>
      <circle cx="6" cy="18" r="2.6" />
      <circle cx="18" cy="18" r="2.6" />
      <path d="M7.6 16 18.5 4M16.4 16 5.5 4" />
    </>
  ),
  navalha: (
    <>
      <path d="M3 15.5 14.5 4a2.1 2.1 0 0 1 3 3L6 18.5z" />
      <path d="M14.5 10.5 21 17a2 2 0 0 1-2.8 2.8L16 17.6" />
    </>
  ),
  pente: (
    <>
      <path d="M3 8h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" />
      <path d="M6 8V4M10 8V4M14 8V4M18 8V4" />
    </>
  ),
  poste: (
    <>
      <rect x="8.5" y="5" width="7" height="14" rx="3.5" />
      <path d="M8.8 9.5 15.2 6.2M8.8 13.5 15.2 10.2M8.8 17.5 15.2 14.2" />
      <path d="M7 3.5h10M7 20.5h10" />
    </>
  ),
}

export default function DivisorBarbearia({
  simbolo = 'tesoura',
  className = '',
}: { simbolo?: Simbolo; className?: string }) {
  return (
    <div aria-hidden="true" className={`flex items-center justify-center gap-4 px-6 py-8 ${className}`}>
      <span className="h-px w-full max-w-[140px] bg-gradient-to-r from-transparent to-vermelho-poste/45" />
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6 shrink-0 text-vermelho-poste"
      >
        {CAMINHOS[simbolo]}
      </svg>
      <span className="h-px w-full max-w-[140px] bg-gradient-to-l from-transparent to-vermelho-poste/45" />
    </div>
  )
}
