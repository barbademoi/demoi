import { iniciais, corDoNome } from '@/lib/avatar'

interface Props {
  nome: string
  fotoUrl?: string | null
  size?: number
}

export default function Avatar({ nome, fotoUrl, size = 48 }: Props) {
  if (fotoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={fotoUrl}
        alt={nome}
        className="rounded-full object-cover bg-border"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold select-none"
      style={{
        width: size,
        height: size,
        backgroundColor: corDoNome(nome),
        fontSize: Math.round(size * 0.38),
      }}
      aria-hidden
    >
      {iniciais(nome)}
    </div>
  )
}
