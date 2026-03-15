import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, ChevronDown, X } from 'lucide-react'

interface GroupedOption {
  value: string
  label: string
  group: string
}

interface SearchableGroupedSelectProps {
  value: string
  onChange: (value: string) => void
  options: GroupedOption[]
  groupLabels: Record<string, string>
  placeholder?: string
  emptyLabel?: string
  emptyOptionLabel?: string
}

export function SearchableGroupedSelect({
  value,
  onChange,
  options,
  groupLabels,
  placeholder = '',
  emptyLabel = 'No results',
  emptyOptionLabel = '— None —',
}: SearchableGroupedSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const selectedOption = options.find((o) => o.value === value)

  const filtered = useMemo(() => {
    if (!search.trim()) return options
    const q = search.toLowerCase()
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    )
  }, [options, search])

  // Group the filtered options, preserving groupLabels key order
  const grouped = useMemo(() => {
    const map = new Map<string, GroupedOption[]>()
    for (const opt of filtered) {
      const arr = map.get(opt.group) ?? []
      arr.push(opt)
      map.set(opt.group, arr)
    }
    // Return in the order of groupLabels keys
    const result: { group: string; label: string; items: GroupedOption[] }[] = []
    for (const key of Object.keys(groupLabels)) {
      const items = map.get(key)
      if (items && items.length > 0) {
        result.push({ group: key, label: groupLabels[key], items })
      }
    }
    // Any remaining groups not in groupLabels
    for (const [key, items] of map) {
      if (!groupLabels[key]) {
        result.push({ group: key, label: key, items })
      }
    }
    return result
  }, [filtered, groupLabels])

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-colors text-left"
      >
        <span className={selectedOption ? '' : 'text-stone-400 dark:text-stone-500'}>
          {selectedOption ? selectedOption.label : emptyOptionLabel}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation()
                onChange('')
                setSearch('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation()
                  onChange('')
                  setSearch('')
                }
              }}
              className="p-0.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded"
            >
              <X className="w-3.5 h-3.5 text-stone-400" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-stone-100 dark:border-stone-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-64 overflow-y-auto">
            {/* "None" option */}
            <button
              type="button"
              onClick={() => {
                onChange('')
                setOpen(false)
                setSearch('')
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${!value
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                  : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                }`}
            >
              {emptyOptionLabel}
            </button>

            {grouped.length === 0 && (
              <div className="px-3 py-4 text-sm text-stone-400 dark:text-stone-500 text-center">
                {emptyLabel}
              </div>
            )}

            {grouped.map(({ group, label, items }) => (
              <div key={group}>
                <div className="sticky top-0 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/80">
                  {label}
                </div>
                {items.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value)
                      setOpen(false)
                      setSearch('')
                    }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${opt.value === value
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
