import { SkeletonBlock, SkeletonLine, SkeletonButton, SkeletonCard } from '@/components/skeleton'

export function ProductCategoryDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6 px-4">
      {/* Back link */}
      <SkeletonLine className="h-3 w-24" />

      {/* Category header */}
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-11 w-11 rounded-xl shrink-0" />
        <div className="space-y-1.5">
          <SkeletonBlock className="h-7 w-40" />
          <SkeletonLine className="h-3 w-24" />
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonButton key={i} className="h-8 w-16 rounded-full" />
        ))}
      </div>

      {/* Product cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonCard key={i} className="space-y-3 p-4">
            <SkeletonBlock className="h-32 w-full rounded-xl" />
            <SkeletonBlock className="h-4 w-3/4" />
            <SkeletonLine className="h-3 w-full" />
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-5 w-16" />
              <SkeletonButton className="h-8 w-20 rounded-lg" />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  )
}
