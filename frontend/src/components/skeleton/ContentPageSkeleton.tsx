import { SkeletonBlock, SkeletonLine } from './SkeletonPrimitives'

interface ContentPageSkeletonProps {
  sections?: number
  maxWidth?: string
}

export function ContentPageSkeleton({ sections = 4, maxWidth = 'max-w-[640px]' }: ContentPageSkeletonProps) {
  return (
    <div className="flex items-start justify-center py-12 px-4">
      <div className={`w-full ${maxWidth} space-y-8`}>
        <SkeletonBlock className="h-7 w-48" />
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-6 sm:p-8 space-y-8">
          {Array.from({ length: sections }, (_, i) => (
            <div key={i} className="space-y-3">
              <SkeletonBlock className="h-5 w-36" />
              <SkeletonLine className="h-3 w-full" />
              <SkeletonLine className="h-3 w-full" />
              <SkeletonLine className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
