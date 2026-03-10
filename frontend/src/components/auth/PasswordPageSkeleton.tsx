import { SkeletonBlock, SkeletonLine, SkeletonButton } from '@/components/skeleton'

export function PasswordPageSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-200 dark:border-stone-800 p-8">
          {/* Header */}
          <div className="text-center mb-6 space-y-2">
            <SkeletonBlock className="h-7 w-48 mx-auto" />
            <SkeletonLine className="h-3 w-64 mx-auto" />
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            <SkeletonButton className="h-11 w-full" />
            <SkeletonButton className="h-11 w-full" />
            <SkeletonButton className="h-11 w-full rounded-lg" />
          </div>

          {/* Back link */}
          <div className="mt-6 flex justify-center">
            <SkeletonLine className="h-3 w-32" />
          </div>
        </div>
      </div>
    </div>
  )
}
