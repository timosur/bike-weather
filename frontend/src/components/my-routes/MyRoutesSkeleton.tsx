import { SkeletonBlock, SkeletonLine, SkeletonCard } from '@/components/skeleton'

export function MyRoutesSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-5 py-6 px-4">
      {/* Title + count badge */}
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-8 w-40" />
        <SkeletonBlock className="h-6 w-8 rounded-full" />
      </div>

      {/* Route cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonCard key={i} className="space-y-3 p-4">
            <SkeletonBlock className="h-5 w-3/4" />
            <SkeletonLine className="h-3 w-1/2" />
            <div className="flex items-center gap-3">
              <SkeletonLine className="h-3 w-16" />
              <SkeletonLine className="h-3 w-20" />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
              <SkeletonBlock className="h-5 w-16 rounded-full" />
              <SkeletonLine className="h-3 w-20" />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  )
}
