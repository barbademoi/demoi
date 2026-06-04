interface AutoplayVideoProps {
  src: string
  className?: string
  poster?: string
}

// Vídeo autoplay sem áudio (atributo `muted` é o que permite autoplay no iOS).
// `src` é o nome base do arquivo (sem extensão), procurado em
// /landing/optimized/. Browsers escolhem WebM se suportarem, senão MP4.
export function AutoplayVideo({ src, className = '', poster }: AutoplayVideoProps) {
  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      poster={poster}
      preload="metadata"
      className={`w-full h-full object-contain bg-areia ${className}`}
    >
      <source src={`/landing/optimized/${src}.webm`} type="video/webm" />
      <source src={`/landing/optimized/${src}.mp4`} type="video/mp4" />
    </video>
  )
}
