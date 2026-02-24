import { SkeletonBlock, SkeletonLine, SkeletonButton, SkeletonCard, SkeletonCircle } from '@/components/skeleton'

export function RideReportSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6 px-4">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <SkeletonBlock className="h-8 w-56" />
          <div className="flex gap-2">
            <SkeletonButton className="h-9 w-9 rounded-xl" />
            <SkeletonButton className="h-9 w-28 rounded-xl" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SkeletonLine className="h-3 w-24" />
          <SkeletonLine className="h-3 w-20" />
          <SkeletonLine className="h-3 w-16" />
        </div>
        <SkeletonBlock className="h-7 w-32 rounded-full" />
      </div>

      {/* Day tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 3 }, (_, i) => (
          <SkeletonButton key={i} className="h-9 w-20 rounded-full" />
        ))}
      </div>

      {/* Weather panel */}
      <SkeletonCard className="space-y-4">
        <SkeletonLine className="h-3 w-16 uppercase" />
        <div className="flex items-center gap-4 mb-4">
          <SkeletonCircle className="w-14 h-14" />
          <div className="space-y-1.5">
            <SkeletonBlock className="h-7 w-20" />
            <SkeletonLine className="h-3 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="space-y-1.5">
              <SkeletonLine className="h-3 w-16" />
              <SkeletonBlock className="h-5 w-12" />
            </div>
          ))}
        </div>
      </SkeletonCard>

      {/* Clothing items */}
      <div className="space-y-3">
        <SkeletonLine className="h-3 w-24 uppercase" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonCard key={i} className="flex items-center gap-3 p-3">
              <SkeletonCircle className="w-10 h-10 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonLine className="h-3 w-16" />
              </div>
            </SkeletonCard>
          ))}
        </div>
      </div>

      {/* Equipment checklist */}
      <div className="space-y-3">
        <SkeletonLine className="h-3 w-28 uppercase" />
        <SkeletonCard className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonBlock className="h-5 w-5 rounded" />
              <SkeletonLine className="h-3 w-40" />
            </div>
          ))}
        </SkeletonCard>
      </div>
    </div>
  )
}
