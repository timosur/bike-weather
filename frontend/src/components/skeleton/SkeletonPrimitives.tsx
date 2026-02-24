interface SkeletonProps {
  className?: string
}

export function SkeletonBlock({ className = 'h-4 w-full' }: SkeletonProps) {
  return <div className={`animate-pulse rounded-lg bg-stone-200 dark:bg-stone-700 ${className}`} />
}

export function SkeletonCircle({ className = 'w-10 h-10' }: SkeletonProps) {
  return <div className={`animate-pulse rounded-full bg-stone-200 dark:bg-stone-700 ${className}`} />
}

export function SkeletonLine({ className = 'h-3 w-full' }: SkeletonProps) {
  return <div className={`animate-pulse rounded bg-stone-200 dark:bg-stone-700 ${className}`} />
}

export function SkeletonButton({ className = 'h-11 w-full' }: SkeletonProps) {
  return <div className={`animate-pulse rounded-xl bg-stone-200 dark:bg-stone-700 ${className}`} />
}

export function SkeletonCard({ className, children }: SkeletonProps & { children?: React.ReactNode }) {
  return (
    <div className={`rounded-2xl bg-white dark:bg-stone-900 ring-1 ring-stone-200 dark:ring-stone-800 p-5 ${className ?? ''}`}>
      {children}
    </div>
  )
}
