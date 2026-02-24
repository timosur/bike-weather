import { SkeletonBlock, SkeletonLine, SkeletonCard } from '@/components/skeleton'

export function ProductCategoriesSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6 px-4">
      {/* Title + description */}
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-32" />
        <SkeletonLine className="h-3 w-64" />
      </div>

      {/* Category cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonCard key={i} className="flex items-center gap-3 p-4">
            <SkeletonBlock className="h-11 w-11 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonLine className="h-3 w-20" />
            </div>
            <SkeletonBlock className="h-4 w-4 rounded shrink-0" />
          </SkeletonCard>
        ))}
      </div>
    </div>
  )
}
