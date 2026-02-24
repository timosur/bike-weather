import { useState, useCallback, useEffect } from 'react'
import { Plus, ChevronUp, ChevronDown } from 'lucide-react'
import { AdminDataTable, type Column } from '@/components/admin/shared/AdminDataTable'
import { SearchFilterBar } from '@/components/admin/shared/SearchFilterBar'
import { SlidePanel } from '@/components/admin/shared/SlidePanel'
import { StatusBadge } from '@/components/admin/shared/StatusBadge'
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog'
import { FormField, TextInput, TextArea, NumberInput, SelectInput, ToggleSwitch } from '@/components/admin/shared/FormComponents'
import { useToast } from '@/hooks/useToast'
import { fetchAdminFaq, createFaqItem, updateFaqItem, deleteFaqItem, reorderFaq } from '@/api/admin/faq'
import type { AdminFaqItem } from '@/components/admin/types'

export default function AdminFaqPage() {
  const { addToast } = useToast()
  const [items, setItems] = useState<AdminFaqItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<AdminFaqItem | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<AdminFaqItem | null>(null)
  const [form, setForm] = useState({ id: '', question: '', answer: '', category: 'general', displayOrder: 0, isPublished: true })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await fetchAdminFaq())
    } catch {
      addToast('Failed to load FAQ items', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => { load() }, [load])

  const filtered = search
    ? items.filter(i => i.question.toLowerCase().includes(search.toLowerCase()))
    : items

  const openCreate = () => {
    setEditing(null)
    setForm({ id: '', question: '', answer: '', category: 'general', displayOrder: items.length, isPublished: true })
    setPanelOpen(true)
  }

  const openEdit = (item: AdminFaqItem) => {
    setEditing(item)
    setForm({ id: item.id, question: item.question, answer: item.answer, category: item.category, displayOrder: item.displayOrder, isPublished: item.isPublished })
    setPanelOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editing) {
        const { id: _id, ...rest } = form
        await updateFaqItem(editing.id, rest)
        addToast('FAQ item updated')
      } else {
        await createFaqItem(form)
        addToast('FAQ item created')
      }
      setPanelOpen(false)
      load()
    } catch {
      addToast('Failed to save FAQ item', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteFaqItem(deleteConfirm.id)
      addToast('FAQ item deleted')
      setDeleteConfirm(null)
      load()
    } catch {
      addToast('Failed to delete FAQ item', 'error')
    }
  }

  const handleReorder = async (item: AdminFaqItem, direction: 'up' | 'down') => {
    const idx = items.findIndex(i => i.id === item.id)
    if ((direction === 'up' && idx <= 0) || (direction === 'down' && idx >= items.length - 1)) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const reordered = items.map((it, i) => ({
      id: it.id,
      displayOrder: i === idx ? items[swapIdx].displayOrder : i === swapIdx ? items[idx].displayOrder : it.displayOrder,
    }))
    try {
      const result = await reorderFaq(reordered)
      setItems(result)
    } catch {
      addToast('Failed to reorder', 'error')
    }
  }

  const columns: Column<AdminFaqItem>[] = [
    { key: 'question', header: 'Question', render: (i) => <span className="font-medium line-clamp-1">{i.question}</span> },
    { key: 'category', header: 'Category', render: (i) => <StatusBadge variant="neutral">{i.category}</StatusBadge> },
    {
      key: 'order', header: 'Order', render: (i) => (
        <div className="flex items-center gap-1">
          <span className="w-6 text-center">{i.displayOrder}</span>
          <button onClick={(e) => { e.stopPropagation(); handleReorder(i, 'up') }} className="p-0.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"><ChevronUp className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); handleReorder(i, 'down') }} className="p-0.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"><ChevronDown className="w-4 h-4" /></button>
        </div>
      )
    },
    { key: 'published', header: 'Published', render: (i) => <StatusBadge variant={i.isPublished ? 'success' : 'warning'}>{i.isPublished ? 'Published' : 'Draft'}</StatusBadge> },
    { key: 'updated', header: 'Updated', render: (i) => new Date(i.updatedAt).toLocaleDateString() },
    {
      key: 'actions', header: '', render: (i) => (
        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(i) }} className="text-xs text-red-500 hover:text-red-700 transition-colors">Delete</button>
      )
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>FAQ</h1>

      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search FAQ..."
        actions={
          <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">
            <Plus className="w-4 h-4" /> Add New
          </button>
        }
      />

      <AdminDataTable columns={columns} data={filtered} keyField="id" loading={loading} onRowClick={openEdit} emptyMessage="No FAQ items found" />

      <SlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editing ? 'Edit FAQ Item' : 'New FAQ Item'}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setPanelOpen(false)} className="px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">{editing ? 'Save' : 'Create'}</button>
          </div>
        }
      >
        <div className="space-y-4">
          {!editing && (
            <FormField label="ID" required>
              <TextInput value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="faq-item-id" />
            </FormField>
          )}
          <FormField label="Question" required>
            <TextInput value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
          </FormField>
          <FormField label="Answer" required>
            <TextArea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={4} />
          </FormField>
          <FormField label="Category">
            <SelectInput value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={[
              { value: 'general', label: 'General' },
              { value: 'weather', label: 'Weather' },
              { value: 'clothing', label: 'Clothing' },
              { value: 'equipment', label: 'Equipment' },
              { value: 'routes', label: 'Routes' },
            ]} />
          </FormField>
          <FormField label="Display Order">
            <NumberInput value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })} />
          </FormField>
          <ToggleSwitch checked={form.isPublished} onChange={(v) => setForm({ ...form, isPublished: v })} label="Published" />
        </div>
      </SlidePanel>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete FAQ Item"
        message={`Are you sure you want to delete this FAQ item? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
