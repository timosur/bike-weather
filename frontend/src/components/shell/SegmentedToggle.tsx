import type { ReactNode } from 'react'

interface SegmentedToggleOption {
  value: string
  label: ReactNode
  ariaLabel?: string
}

interface SegmentedToggleProps {
  options: [SegmentedToggleOption, SegmentedToggleOption]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function SegmentedToggle({ options, value, onChange, className = '' }: SegmentedToggleProps) {
  return (
    <div
      className={`relative inline-flex items-center rounded-lg bg-stone-100 dark:bg-stone-800 p-0.5 ${className}`}
    >
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            aria-label={option.ariaLabel}
            className={`relative z-10 flex items-center justify-center px-2.5 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${isActive
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
