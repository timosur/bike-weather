import { Sun, Moon } from 'lucide-react'
import { SegmentedToggle } from './SegmentedToggle'

interface ThemeToggleProps {
  theme: 'light' | 'dark'
  onToggle: () => void
  className?: string
}

export function ThemeToggle({ theme, onToggle, className = '' }: ThemeToggleProps) {
  return (
    <SegmentedToggle
      className={className}
      value={theme}
      onChange={onToggle}
      options={[
        { value: 'light', label: <Sun className="w-4 h-4" strokeWidth={1.5} />, ariaLabel: 'Light mode' },
        { value: 'dark', label: <Moon className="w-4 h-4" strokeWidth={1.5} />, ariaLabel: 'Dark mode' },
      ]}
    />
  )
}
