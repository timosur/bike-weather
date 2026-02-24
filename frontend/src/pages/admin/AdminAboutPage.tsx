import { useState, useCallback, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { AdminDataTable, type Column } from '@/components/admin/shared/AdminDataTable'
import { SearchFilterBar } from '@/components/admin/shared/SearchFilterBar'
import { SlidePanel } from '@/components/admin/shared/SlidePanel'
import { StatusBadge } from '@/components/admin/shared/StatusBadge'
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog'
import { FormField, TextInput, TextArea, NumberInput, ToggleSwitch } from '@/components/admin/shared/FormComponents'
import { useToast } from '@/hooks/useToast'
import { fetchAdminAbout, createAboutSection, updateAboutSection, deleteAboutSection } from '@/api/admin/about'
import type { AdminAboutContent } from '@/components/admin/types'

export default function AdminAboutPage() {
  const { addToast } = useToast()
  const [items, setItems] = useState<AdminAboutContent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<AdminAboutContent | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<AdminAboutContent | null>(null)
  const [form, setForm] = useState({ sectionKey: '', title: '', body: '', imageUrl: '', displayOrder: 0, isPublished: true })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await fetchAdminAbout())
    } catch {
      addToast('Failed to load about sections', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => { load() }, [load])

  const filtered = search
    ? items.filter(i => i.title.toLowerCase().includes(search.toLowerCase()) || i.sectionKey.toLowerCase().includes(search.toLowerCase()))
    : items

  const openCreate = () => {
    setEditing(null)
    setForm({ sectionKey: '', title: '', body: '', imageUrl: '', displayOrder: items.length, isPublished: true })
    setPanelOpen(true)
  }

  const openEdit = (item: AdminAboutContent) => {
    setEditing(item)
    setForm({ sectionKey: item.sectionKey, title: item.title, body: item.body, imageUrl: item.imageUrl ?? '', displayOrder: item.displayOrder, isPublished: item.isPublished })
    setPanelOpen(true)
  }

  const handleSave = async () => {
    try {
      const payload = { ...form, imageUrl: form.imageUrl || null }
      if (editing) {
        await updateAboutSection(editing.id, payload)
        addToast('About section updated')
      } else {
        await createAboutSection(payload)
        addToast('About section created')
      }
      setPanelOpen(false)
      load()
    } catch {
      addToast('Failed to save about section', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteAboutSection(deleteConfirm.id)
      addToast('About section deleted')
      setDeleteConfirm(null)
      load()
    } catch {
      addToast('Failed to delete about section', 'error')
    }
  }

  const columns: Column<AdminAboutContent>[] = [
    { key: 'sectionKey', header: 'Key', render: (i) => <code className="text-xs bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">{i.sectionKey}</code> },
    { key: 'title', header: 'Title', render: (i) => <span className="font-medium">{i.title}</span> },
    { key: 'published', header: 'Published', render: (i) => <StatusBadge variant={i.isPublished ? 'success' : 'warning'}>{i.isPublished ? 'Published' : 'Draft'}</StatusBadge> },
    { key: 'order', header: 'Order', render: (i) => String(i.displayOrder) },
    { key: 'updated', header: 'Updated', render: (i) => new Date(i.updatedAt).toLocaleDateString() },
    {
      key: 'actions', header: '', render: (i) => (
        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(i) }} className="text-xs text-red-500 hover:text-red-700 transition-colors">Delete</button>
      )
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>About</h1>

      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search about sections..."
        actions={
          <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">
            <Plus className="w-4 h-4" /> Add New
          </button>
        }
      />

      <AdminDataTable columns={columns} data={filtered} keyField="id" loading={loading} onRowClick={openEdit} emptyMessage="No about sections found" />

      <SlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editing ? 'Edit About Section' : 'New About Section'}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setPanelOpen(false)} className="px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">{editing ? 'Save' : 'Create'}</button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Section Key" required>
            <TextInput value={form.sectionKey} onChange={(e) => setForm({ ...form, sectionKey: e.target.value })} placeholder="intro" />
          </FormField>
          <FormField label="Title" required>
            <TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </FormField>
          <FormField label="Body" required>
            <TextArea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={8} />
          </FormField>
          <FormField label="Image URL">
            <TextInput value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
          </FormField>
          {form.imageUrl && <img src={form.imageUrl} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-stone-200 dark:border-stone-700" />}
          <FormField label="Display Order">
            <NumberInput value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })} />
          </FormField>
          <ToggleSwitch checked={form.isPublished} onChange={(v) => setForm({ ...form, isPublished: v })} label="Published" />
        </div>
      </SlidePanel>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete About Section"
        message={`Are you sure you want to delete "${deleteConfirm?.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
