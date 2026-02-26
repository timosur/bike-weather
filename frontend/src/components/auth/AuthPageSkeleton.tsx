import { SkeletonBlock, SkeletonLine, SkeletonButton, SkeletonCard } from '@/components/skeleton'

export function AuthPageSkeleton() {
  return (
    <div className=" flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-[400px] space-y-6">
        {/* Title */}
        <div className="text-center space-y-2">
          <SkeletonBlock className="h-8 w-48 mx-auto" />
          <SkeletonLine className="h-3 w-56 mx-auto" />
        </div>

        {/* Card */}
        <SkeletonCard className="space-y-5">
          {/* Tab toggle */}
          <div className="flex gap-4 border-b border-stone-200 dark:border-stone-800 pb-3">
            <SkeletonBlock className="h-4 w-16" />
            <SkeletonBlock className="h-4 w-20" />
          </div>

          {/* Email field */}
          <div className="space-y-1.5">
            <SkeletonLine className="h-3 w-12" />
            <SkeletonButton className="h-11 w-full" />
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <SkeletonLine className="h-3 w-16" />
            <SkeletonButton className="h-11 w-full" />
          </div>

          {/* Forgot link */}
          <SkeletonLine className="h-3 w-32" />

          {/* Submit button */}
          <SkeletonButton className="h-12 w-full" />
        </SkeletonCard>

        {/* Footer hint */}
        <SkeletonLine className="h-3 w-48 mx-auto" />
      </div>
    </div>
  )
}
