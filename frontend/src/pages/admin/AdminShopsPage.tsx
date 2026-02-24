import { useState, useCallback, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { AdminDataTable, type Column } from '@/components/admin/shared/AdminDataTable'
import { SearchFilterBar } from '@/components/admin/shared/SearchFilterBar'
import { SlidePanel } from '@/components/admin/shared/SlidePanel'
import { FormField, TextInput } from '@/components/admin/shared/FormComponents'
import { useToast } from '@/hooks/useToast'
import { fetchAdminShops, createShop, updateShop } from '@/api/admin/products'
import type { AdminShop } from '@/components/admin/types'

export default function AdminShopsPage() {
  const { addToast } = useToast()
  const [shops, setShops] = useState<AdminShop[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<AdminShop | null>(null)
  const [form, setForm] = useState({ id: '', name: '', logoUrl: '', affiliateTag: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setShops(await fetchAdminShops())
    } catch {
      addToast('Failed to load shops', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => { load() }, [load])

  const filtered = search
    ? shops.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    : shops

  const openCreate = () => {
    setEditing(null)
    setForm({ id: '', name: '', logoUrl: '', affiliateTag: '' })
    setPanelOpen(true)
  }

  const openEdit = (shop: AdminShop) => {
    setEditing(shop)
    setForm({ id: shop.id, name: shop.name, logoUrl: shop.logoUrl, affiliateTag: shop.affiliateTag ?? '' })
    setPanelOpen(true)
  }

  const handleSave = async () => {
    try {
      const payload = { ...form, affiliateTag: form.affiliateTag || null }
      if (editing) {
        const { id: _id, ...rest } = payload
        await updateShop(editing.id, rest)
        addToast('Shop updated')
      } else {
        await createShop(payload)
        addToast('Shop created')
      }
      setPanelOpen(false)
      load()
    } catch {
      addToast('Failed to save shop', 'error')
    }
  }

  const columns: Column<AdminShop>[] = [
    { key: 'name', header: 'Name', render: (s) => <span className="font-medium">{s.name}</span> },
    {
      key: 'logo', header: 'Logo', render: (s) =>
        s.logoUrl ? <img src={s.logoUrl} alt={s.name} className="w-8 h-8 object-contain rounded" /> : <span className="text-stone-400">—</span>,
    },
    { key: 'tag', header: 'Affiliate Tag', render: (s) => s.affiliateTag ?? <span className="text-stone-400">—</span> },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>Shops</h1>

      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search shops..."
        actions={
          <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">
            <Plus className="w-4 h-4" /> Add New
          </button>
        }
      />

      <AdminDataTable columns={columns} data={filtered} keyField="id" loading={loading} onRowClick={openEdit} emptyMessage="No shops found" />

      <SlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editing ? 'Edit Shop' : 'New Shop'}
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
              <TextInput value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="shop-id" />
            </FormField>
          )}
          <FormField label="Name" required>
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <FormField label="Logo URL" required>
            <TextInput value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://..." />
          </FormField>
          {form.logoUrl && <img src={form.logoUrl} alt="Preview" className="w-16 h-16 object-contain rounded-lg border border-stone-200 dark:border-stone-700" />}
          <FormField label="Affiliate Tag">
            <TextInput value={form.affiliateTag} onChange={(e) => setForm({ ...form, affiliateTag: e.target.value })} />
          </FormField>
        </div>
      </SlidePanel>
    </div>
  )
}
