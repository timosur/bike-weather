import { SkeletonBlock, SkeletonLine, SkeletonCard } from './SkeletonPrimitives'

interface ContentPageSkeletonProps {
  sections?: number
  maxWidth?: string
}

export function ContentPageSkeleton({ sections = 4, maxWidth = 'max-w-[640px]' }: ContentPageSkeletonProps) {
  return (
    <div className={`${maxWidth} mx-auto space-y-6 py-6 px-4`}>
      <SkeletonBlock className="h-8 w-48" />
      <SkeletonCard>
        <div className="space-y-8">
          {Array.from({ length: sections }, (_, i) => (
            <div key={i} className="space-y-3">
              <SkeletonBlock className="h-5 w-36" />
              <SkeletonLine className="h-3 w-full" />
              <SkeletonLine className="h-3 w-full" />
              <SkeletonLine className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </SkeletonCard>
    </div>
  )
}
