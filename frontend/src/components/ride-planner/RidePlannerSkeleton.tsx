import { SkeletonBlock, SkeletonLine, SkeletonButton } from '@/components/skeleton'

export function RidePlannerSkeleton() {
  return (
    <div className="flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-[480px] space-y-5">
        {/* Title + description */}
        <div className="text-center space-y-2">
          <SkeletonBlock className="h-9 w-64 mx-auto" />
          <SkeletonLine className="h-3 w-48 mx-auto" />
        </div>

        {/* Form card */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="p-6 space-y-5">
            {/* Location field */}
            <div className="space-y-1.5">
              <SkeletonLine className="h-3 w-16" />
              <SkeletonButton className="h-11 w-full" />
            </div>

            {/* Date / Time grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <SkeletonLine className="h-3 w-12" />
                <SkeletonButton className="h-11 w-full" />
              </div>
              <div className="space-y-1.5">
                <SkeletonLine className="h-3 w-12" />
                <SkeletonButton className="h-11 w-full" />
              </div>
            </div>

            {/* Bike type grid */}
            <div className="space-y-1.5">
              <SkeletonLine className="h-3 w-16" />
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <SkeletonButton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>

            {/* Intensity grid */}
            <div className="space-y-1.5">
              <SkeletonLine className="h-3 w-20" />
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }, (_, i) => (
                  <SkeletonButton key={i} className="h-11 w-full" />
                ))}
              </div>
            </div>

            {/* Advanced toggle */}
            <SkeletonLine className="h-3 w-32 mx-auto" />

            {/* Divider */}
            <div className="border-t border-stone-200 dark:border-stone-800" />

            {/* Multi-day toggle */}
            <div className="flex items-center justify-between">
              <SkeletonLine className="h-3 w-24" />
              <SkeletonBlock className="h-6 w-11 rounded-full" />
            </div>
          </div>

          {/* Submit button */}
          <div className="px-6 pb-6 space-y-3">
            <SkeletonButton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
