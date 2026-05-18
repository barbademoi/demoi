import Skeleton from '@/components/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar placeholder */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-surface border-r border-border p-6 gap-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-20" />
        <div className="space-y-2 mt-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </aside>

      <div className="flex-1 lg:pl-64 pt-14 lg:pt-0">
        {/* Mobile top bar placeholder */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-surface border-b border-border px-4 flex items-center gap-3">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-6 w-32" />
        </div>

        {/* Desktop header placeholder */}
        <div className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Content placeholder */}
        <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
          {/* Meta coletiva card */}
          <Skeleton className="h-32 w-full" />

          {/* Ranking title */}
          <Skeleton className="h-6 w-40 mt-8" />

          {/* Ranking cards */}
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
