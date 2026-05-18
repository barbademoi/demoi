import Skeleton from '@/components/Skeleton'

export default function ConfiguracoesLoading() {
  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-9 w-28" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>

        {/* Form sections */}
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />

      </div>
    </main>
  )
}
