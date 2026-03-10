import { SkeletonBlock, SkeletonLine, SkeletonButton, SkeletonCircle } from '@/components/skeleton'

export function RideReportSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <SkeletonBlock className="h-7 w-56" />
          <div className="hidden md:flex gap-2">
            <SkeletonButton className="h-9 w-9 rounded-xl" />
            <SkeletonButton className="h-9 w-28 rounded-xl" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SkeletonLine className="h-3 w-24" />
          <SkeletonLine className="h-3 w-20" />
          <SkeletonLine className="h-3 w-16" />
        </div>
        <div className="hidden md:flex flex-wrap items-center gap-2">
          <SkeletonButton className="h-9 w-9 rounded-xl" />
          <SkeletonButton className="h-9 w-28 rounded-xl" />
          <SkeletonButton className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* Condition badge */}
      <SkeletonBlock className="h-12 w-full rounded-2xl" />

      {/* Route map */}
      <div className="space-y-4">
        <SkeletonBlock className="h-64 sm:h-80 w-full rounded-2xl" />
      </div>

      {/* Weather panel */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl ring-1 ring-stone-200 dark:ring-stone-800 p-5 space-y-4">
        <SkeletonLine className="h-3 w-16" />
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
      </div>

      {/* Clothing items */}
      <div className="space-y-3">
        <SkeletonLine className="h-3 w-24" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="bg-white dark:bg-stone-900 rounded-2xl ring-1 ring-stone-200 dark:ring-stone-800 p-3 flex items-center gap-3">
              <SkeletonCircle className="w-10 h-10 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonLine className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Equipment checklist */}
      <div className="space-y-3">
        <SkeletonLine className="h-3 w-28" />
        <div className="bg-white dark:bg-stone-900 rounded-2xl ring-1 ring-stone-200 dark:ring-stone-800 p-5 space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonBlock className="h-5 w-5 rounded" />
              <SkeletonLine className="h-3 w-40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
