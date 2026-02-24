import { Search } from 'lucide-react'

interface SearchFilterBarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters?: React.ReactNode
  actions?: React.ReactNode
}

export function SearchFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  actions,
}: SearchFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-colors"
        />
      </div>
      {filters && <div className="flex items-center gap-2">{filters}</div>}
      {actions && <div className="flex items-center gap-2 sm:ml-auto">{actions}</div>}
    </div>
  )
}
