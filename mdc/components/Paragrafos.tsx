/** Texto com quebras de linha vindo do admin → parágrafos. */
export default function Paragrafos({ texto, className = '' }: { texto: string; className?: string }) {
  const partes = texto.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  return (
    <div className={`space-y-4 ${className}`}>
      {partes.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  )
}
