import { ReactNode } from 'react'

export interface Column<T> {
  key: string
  header: string
  render: (item: T) => ReactNode
  className?: string
}

interface AdminDataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField: keyof T
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (item: T) => void
  page?: number
  pageSize?: number
  total?: number
  onPageChange?: (page: number) => void
}

export function AdminDataTable<T>({
  columns,
  data,
  keyField,
  loading,
  emptyMessage = 'No data found',
  onRowClick,
  page,
  pageSize,
  total,
  onPageChange,
}: AdminDataTableProps<T>) {
  const totalPages = total && pageSize ? Math.ceil(total / pageSize) : 0

  if (loading) {
    return (
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider"
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr
                  key={i}
                  className="border-b border-stone-100 dark:border-stone-800 last:border-0"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-12 text-center">
        <p className="text-stone-500 dark:text-stone-400">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-stone-50 dark:bg-stone-900/80 backdrop-blur">
            <tr className="border-b border-stone-200 dark:border-stone-800">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider ${col.className ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr
                key={String(item[keyField])}
                onClick={() => onRowClick?.(item)}
                className={`border-b border-stone-100 dark:border-stone-800 last:border-0 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50' : ''
                  } ${idx % 2 === 1 ? 'bg-stone-50/50 dark:bg-stone-900/50' : ''}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-sm text-stone-700 dark:text-stone-300 ${col.className ?? ''}`}>
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && page && onPageChange && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200 dark:border-stone-800">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Showing {((page - 1) * (pageSize ?? 50)) + 1}–{Math.min(page * (pageSize ?? 50), total ?? 0)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="px-2 text-xs text-stone-500 dark:text-stone-400">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
