import { SkeletonBlock, SkeletonLine, SkeletonButton } from '@/components/skeleton'

export function AuthPageSkeleton() {
  return (
    <div className="flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-[400px] space-y-6">
        {/* Title */}
        <div className="text-center space-y-1">
          <SkeletonBlock className="h-7 w-48 mx-auto" />
          <SkeletonLine className="h-3 w-56 mx-auto" />
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          {/* Tab toggle */}
          <div className="flex border-b border-stone-100 dark:border-stone-800">
            <div className="flex-1 flex justify-center py-3">
              <SkeletonBlock className="h-4 w-16" />
            </div>
            <div className="flex-1 flex justify-center py-3">
              <SkeletonBlock className="h-4 w-20" />
            </div>
          </div>

          {/* Form area */}
          <div className="p-6 space-y-5">
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
            <SkeletonButton className="h-11 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
