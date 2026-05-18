import Skeleton from '@/components/Skeleton'

export default function TreinamentosLoading() {
  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>

        {/* Banner mobile */}
        <Skeleton className="h-20 w-full mb-8" />

        {/* Cards */}
        <div className="space-y-3 mb-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>

        {/* Bloco suporte */}
        <Skeleton className="h-32 w-full" />

      </div>
    </main>
  )
}
