import { useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { AdminDataTable, type Column } from '@/components/admin/shared/AdminDataTable'
import { SearchFilterBar } from '@/components/admin/shared/SearchFilterBar'
import { SlidePanel } from '@/components/admin/shared/SlidePanel'
import { StatusBadge } from '@/components/admin/shared/StatusBadge'
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog'
import { FormField, TextInput, TextArea, NumberInput, SelectInput, ToggleSwitch } from '@/components/admin/shared/FormComponents'
import { useToast } from '@/hooks/useToast'
import { fetchAdminProducts, createProduct, updateProduct, deleteProduct, fetchAdminCategories, fetchAdminShops } from '@/api/admin/products'
import type { AdminProduct, AdminCategory, AdminShop, PaginatedResponse } from '@/components/admin/types'
import { useEffect } from 'react'

export default function AdminProductsPage() {
  const { addToast } = useToast()
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 50
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterShop, setFilterShop] = useState('')
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [shops, setShops] = useState<AdminShop[]>([])

  // Panel state
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<AdminProduct | null>(null)

  // Form state
  const [form, setForm] = useState({
    id: '', name: '', categoryId: '', imageUrl: '', price: 0, currency: 'EUR',
    shopId: '', affiliateUrl: '', matchesZone: '', matchesLabel: '',
    weatherTempMin: '', weatherTempMax: '', weatherPrecipitation: 'none',
    weatherWind: 'none', weatherSummary: '', isPublished: true,
  })

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const result: PaginatedResponse<AdminProduct> = await fetchAdminProducts(
        page, pageSize,
        search || undefined,
        filterCategory || undefined,
        filterShop || undefined,
      )
      setProducts(result.items)
      setTotal(result.total)
    } catch {
      addToast('Failed to load products', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, search, filterCategory, filterShop, addToast])

  useEffect(() => { loadProducts() }, [loadProducts])

  useEffect(() => {
    Promise.all([fetchAdminCategories(), fetchAdminShops()])
      .then(([cats, shps]) => { setCategories(cats); setShops(shps) })
      .catch(() => { })
  }, [])

  const openCreate = () => {
    setEditingProduct(null)
    setForm({
      id: '', name: '', categoryId: categories[0]?.id ?? '', imageUrl: '', price: 0, currency: 'EUR',
      shopId: shops[0]?.id ?? '', affiliateUrl: '', matchesZone: '', matchesLabel: '',
      weatherTempMin: '', weatherTempMax: '', weatherPrecipitation: 'none',
      weatherWind: 'none', weatherSummary: '', isPublished: true,
    })
    setPanelOpen(true)
  }

  const openEdit = (product: AdminProduct) => {
    setEditingProduct(product)
    setForm({
      id: product.id,
      name: product.name,
      categoryId: product.categoryId,
      imageUrl: product.imageUrl,
      price: product.price,
      currency: product.currency,
      shopId: product.shopId,
      affiliateUrl: product.affiliateUrl,
      matchesZone: product.matchesZone ?? '',
      matchesLabel: product.matchesLabel,
      weatherTempMin: product.weatherTempMin?.toString() ?? '',
      weatherTempMax: product.weatherTempMax?.toString() ?? '',
      weatherPrecipitation: product.weatherPrecipitation,
      weatherWind: product.weatherWind,
      weatherSummary: product.weatherSummary,
      isPublished: product.isPublished,
    })
    setPanelOpen(true)
  }

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        matchesZone: form.matchesZone || null,
        weatherTempMin: form.weatherTempMin ? parseFloat(form.weatherTempMin) : null,
        weatherTempMax: form.weatherTempMax ? parseFloat(form.weatherTempMax) : null,
      }
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload)
        addToast('Product updated')
      } else {
        await createProduct(payload)
        addToast('Product created')
      }
      setPanelOpen(false)
      loadProducts()
    } catch {
      addToast('Failed to save product', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteProduct(deleteConfirm.id)
      addToast('Product deleted')
      setDeleteConfirm(null)
      loadProducts()
    } catch {
      addToast('Failed to delete product', 'error')
    }
  }

  const categoryName = (id: string) => categories.find(c => c.id === id)?.name ?? id
  const shopName = (id: string) => shops.find(s => s.id === id)?.name ?? id

  const columns: Column<AdminProduct>[] = [
    { key: 'name', header: 'Name', render: (p) => <span className="font-medium">{p.name}</span> },
    { key: 'category', header: 'Category', render: (p) => <StatusBadge variant="neutral">{categoryName(p.categoryId)}</StatusBadge> },
    { key: 'shop', header: 'Shop', render: (p) => shopName(p.shopId) },
    { key: 'price', header: 'Price', render: (p) => `${p.price.toFixed(2)} ${p.currency}` },
    { key: 'published', header: 'Published', render: (p) => <StatusBadge variant={p.isPublished ? 'success' : 'warning'}>{p.isPublished ? 'Published' : 'Draft'}</StatusBadge> },
    { key: 'updated', header: 'Updated', render: (p) => new Date(p.updatedAt).toLocaleDateString() },
    {
      key: 'actions', header: '', render: (p) => (
        <button
          onClick={(e) => { e.stopPropagation(); setDeleteConfirm(p) }}
          className="text-xs text-red-500 hover:text-red-700 transition-colors"
        >
          Delete
        </button>
      ),
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
        Products
      </h1>

      <SearchFilterBar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        searchPlaceholder="Search products..."
        filters={
          <>
            <SelectInput
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setPage(1) }}
              options={[{ value: '', label: 'All Categories' }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
              className="!w-auto"
            />
            <SelectInput
              value={filterShop}
              onChange={(e) => { setFilterShop(e.target.value); setPage(1) }}
              options={[{ value: '', label: 'All Shops' }, ...shops.map(s => ({ value: s.id, label: s.name }))]}
              className="!w-auto"
            />
          </>
        }
        actions={
          <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">
            <Plus className="w-4 h-4" /> Add New
          </button>
        }
      />

      <AdminDataTable
        columns={columns}
        data={products}
        keyField="id"
        loading={loading}
        onRowClick={openEdit}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        emptyMessage="No products found"
      />

      {/* Create/Edit Panel */}
      <SlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editingProduct ? 'Edit Product' : 'New Product'}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setPanelOpen(false)} className="px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {!editingProduct && (
            <FormField label="ID" required>
              <TextInput value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="unique-product-id" />
            </FormField>
          )}
          <FormField label="Name" required>
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category" required>
              <SelectInput value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} options={categories.map(c => ({ value: c.id, label: c.name }))} />
            </FormField>
            <FormField label="Shop" required>
              <SelectInput value={form.shopId} onChange={(e) => setForm({ ...form, shopId: e.target.value })} options={shops.map(s => ({ value: s.id, label: s.name }))} />
            </FormField>
          </div>
          <FormField label="Image URL" required>
            <TextInput value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
          </FormField>
          {form.imageUrl && (
            <img src={form.imageUrl} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-stone-200 dark:border-stone-700" />
          )}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Price" required>
              <NumberInput value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} step="0.01" min="0" />
            </FormField>
            <FormField label="Currency">
              <TextInput value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
            </FormField>
          </div>
          <FormField label="Affiliate URL" required>
            <TextInput value={form.affiliateUrl} onChange={(e) => setForm({ ...form, affiliateUrl: e.target.value })} placeholder="https://..." />
          </FormField>
          <FormField label="Matches Label" required>
            <TextInput value={form.matchesLabel} onChange={(e) => setForm({ ...form, matchesLabel: e.target.value })} />
          </FormField>
          <FormField label="Matches Zone">
            <TextInput value={form.matchesZone} onChange={(e) => setForm({ ...form, matchesZone: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Temp Min (°C)">
              <TextInput value={form.weatherTempMin} onChange={(e) => setForm({ ...form, weatherTempMin: e.target.value })} />
            </FormField>
            <FormField label="Temp Max (°C)">
              <TextInput value={form.weatherTempMax} onChange={(e) => setForm({ ...form, weatherTempMax: e.target.value })} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Precipitation">
              <SelectInput value={form.weatherPrecipitation} onChange={(e) => setForm({ ...form, weatherPrecipitation: e.target.value })} options={[{ value: 'none', label: 'None' }, { value: 'light', label: 'Light' }, { value: 'heavy', label: 'Heavy' }]} />
            </FormField>
            <FormField label="Wind">
              <SelectInput value={form.weatherWind} onChange={(e) => setForm({ ...form, weatherWind: e.target.value })} options={[{ value: 'none', label: 'None' }, { value: 'light', label: 'Light' }, { value: 'strong', label: 'Strong' }]} />
            </FormField>
          </div>
          <FormField label="Weather Summary">
            <TextArea value={form.weatherSummary} onChange={(e) => setForm({ ...form, weatherSummary: e.target.value })} rows={2} />
          </FormField>
          <ToggleSwitch checked={form.isPublished} onChange={(v) => setForm({ ...form, isPublished: v })} label="Published" />
        </div>
      </SlidePanel>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
