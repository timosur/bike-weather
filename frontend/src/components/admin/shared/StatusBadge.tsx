interface StatusBadgeProps {
  variant: 'success' | 'warning' | 'neutral' | 'danger'
  children: React.ReactNode
}

const variantClasses: Record<StatusBadgeProps['variant'], string> = {
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  neutral: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
  danger: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
}

export function StatusBadge({ variant, children }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  )
}
