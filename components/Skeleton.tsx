interface Props {
  className?: string
}

/**
 * Skeleton primitive — bloco com pulse animation usando shimmer suave.
 * Use composto pra montar o layout do loading state.
 */
export default function Skeleton({ className = '' }: Props) {
  return (
    <div
      aria-hidden
      className={`rounded-xl bg-surface-2 animate-pulse ${className}`}
    />
  )
}
