import { useState, useCallback, useEffect } from 'react'
import { AdminDataTable, type Column } from '@/components/admin/shared/AdminDataTable'
import { SearchFilterBar } from '@/components/admin/shared/SearchFilterBar'
import { SlidePanel } from '@/components/admin/shared/SlidePanel'
import { StatusBadge } from '@/components/admin/shared/StatusBadge'
import { SelectInput } from '@/components/admin/shared/FormComponents'
import { useToast } from '@/hooks/useToast'
import { fetchAdminContacts } from '@/api/admin/contacts'
import type { AdminContactMessage, PaginatedResponse } from '@/components/admin/types'

export default function AdminContactsPage() {
  const { addToast } = useToast()
  const [messages, setMessages] = useState<AdminContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 50
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [selected, setSelected] = useState<AdminContactMessage | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result: PaginatedResponse<AdminContactMessage> = await fetchAdminContacts(
        page, pageSize,
        search || undefined,
        filterCategory || undefined,
      )
      setMessages(result.items)
      setTotal(result.total)
    } catch {
      addToast('Failed to load messages', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, search, filterCategory, addToast])

  useEffect(() => { load() }, [load])

  const columns: Column<AdminContactMessage>[] = [
    { key: 'name', header: 'Name', render: (m) => <span className="font-medium">{m.name}</span> },
    { key: 'email', header: 'Email', render: (m) => m.email },
    { key: 'category', header: 'Category', render: (m) => <StatusBadge variant="neutral">{m.category}</StatusBadge> },
    { key: 'message', header: 'Message', render: (m) => <span className="line-clamp-1 max-w-xs">{m.message}</span> },
    { key: 'date', header: 'Date', render: (m) => new Date(m.createdAt).toLocaleDateString() },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>Contact Messages</h1>

      <SearchFilterBar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        searchPlaceholder="Search by name or email..."
        filters={
          <SelectInput
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1) }}
            options={[
              { value: '', label: 'All Categories' },
              { value: 'feedback', label: 'Feedback' },
              { value: 'bug', label: 'Bug' },
              { value: 'feature', label: 'Feature' },
              { value: 'sonstiges', label: 'Sonstiges' },
            ]}
            className="!w-auto"
          />
        }
      />

      <AdminDataTable
        columns={columns}
        data={messages}
        keyField="id"
        loading={loading}
        onRowClick={setSelected}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        emptyMessage="No messages found"
      />

      <SlidePanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Contact Message"
        size="md"
      >
        {selected && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">From</p>
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{selected.name}</p>
              <p className="text-sm text-stone-600 dark:text-stone-400">{selected.email}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Category</p>
              <StatusBadge variant="neutral">{selected.category}</StatusBadge>
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Date</p>
              <p className="text-sm text-stone-700 dark:text-stone-300">{new Date(selected.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Message</p>
              <p className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{selected.message}</p>
            </div>
          </div>
        )}
      </SlidePanel>
    </div>
  )
}
