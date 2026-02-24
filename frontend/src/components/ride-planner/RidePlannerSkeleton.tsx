import { SkeletonBlock, SkeletonLine, SkeletonButton, SkeletonCard } from '@/components/skeleton'

export function RidePlannerSkeleton() {
  return (
    <div className="relative flex flex-col items-center px-4 py-8">
      {/* Title + description */}
      <div className="mb-6 text-center space-y-2">
        <SkeletonBlock className="h-8 w-64 mx-auto" />
        <SkeletonLine className="h-3 w-48 mx-auto" />
      </div>

      {/* Preset pills */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 3 }, (_, i) => (
          <SkeletonButton key={i} className="h-9 w-28 rounded-full" />
        ))}
      </div>

      {/* Form card */}
      <div className="w-full max-w-[480px]">
        <SkeletonCard className="space-y-5">
          {/* Location field */}
          <div className="space-y-1.5">
            <SkeletonLine className="h-3 w-16" />
            <SkeletonButton className="h-11 w-full" />
          </div>

          {/* Date / Time grid */}
          <div className="grid grid-cols-2 gap-3">
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

          {/* Intensity bar */}
          <div className="space-y-1.5">
            <SkeletonLine className="h-3 w-20" />
            <SkeletonButton className="h-11 w-full" />
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

          {/* Submit button */}
          <SkeletonButton className="h-12 w-full" />
        </SkeletonCard>
      </div>
    </div>
  )
}
