import { useState, useCallback, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { AdminDataTable, type Column } from '@/components/admin/shared/AdminDataTable'
import { SearchFilterBar } from '@/components/admin/shared/SearchFilterBar'
import { SlidePanel } from '@/components/admin/shared/SlidePanel'
import { FormField, TextInput, NumberInput } from '@/components/admin/shared/FormComponents'
import { useToast } from '@/hooks/useToast'
import { fetchAdminCategories, createCategory, updateCategory } from '@/api/admin/products'
import type { AdminCategory } from '@/components/admin/types'

export default function AdminCategoriesPage() {
  const { addToast } = useToast()
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<AdminCategory | null>(null)
  const [form, setForm] = useState({ id: '', name: '', slug: '', description: '', icon: '', displayOrder: 0 })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAdminCategories()
      setCategories(data)
    } catch {
      addToast('Failed to load categories', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => { load() }, [load])

  const filtered = search
    ? categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories

  const openCreate = () => {
    setEditing(null)
    setForm({ id: '', name: '', slug: '', description: '', icon: '', displayOrder: 0 })
    setPanelOpen(true)
  }

  const openEdit = (cat: AdminCategory) => {
    setEditing(cat)
    setForm({ id: cat.id, name: cat.name, slug: cat.slug, description: cat.description, icon: cat.icon, displayOrder: cat.displayOrder })
    setPanelOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editing) {
        const { id: _id, ...rest } = form
        await updateCategory(editing.id, rest)
        addToast('Category updated')
      } else {
        await createCategory(form)
        addToast('Category created')
      }
      setPanelOpen(false)
      load()
    } catch {
      addToast('Failed to save category', 'error')
    }
  }

  const columns: Column<AdminCategory>[] = [
    { key: 'name', header: 'Name', render: (c) => <span className="font-medium">{c.name}</span> },
    { key: 'slug', header: 'Slug', render: (c) => <code className="text-xs bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">{c.slug}</code> },
    { key: 'icon', header: 'Icon', render: (c) => c.icon },
    { key: 'order', header: 'Order', render: (c) => String(c.displayOrder) },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>Categories</h1>

      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search categories..."
        actions={
          <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">
            <Plus className="w-4 h-4" /> Add New
          </button>
        }
      />

      <AdminDataTable columns={columns} data={filtered} keyField="id" loading={loading} onRowClick={openEdit} emptyMessage="No categories found" />

      <SlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editing ? 'Edit Category' : 'New Category'}
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
              <TextInput value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="category-id" />
            </FormField>
          )}
          <FormField label="Name" required>
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <FormField label="Slug" required>
            <TextInput value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </FormField>
          <FormField label="Description">
            <TextInput value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </FormField>
          <FormField label="Icon" required>
            <TextInput value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
          </FormField>
          <FormField label="Display Order">
            <NumberInput value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })} />
          </FormField>
        </div>
      </SlidePanel>
    </div>
  )
}
