import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FormField, SelectInput, NumberInput } from '../shared/FormComponents'
import type { AgentShop, AgentCategory } from '../types'
import { fetchAgentShops, fetchAgentCategories } from '@/api/admin/agent'

interface ImportConfigFormProps {
  onStart: (shop: string, category: string, maxProducts: number) => void
  disabled?: boolean
}

export function ImportConfigForm({ onStart, disabled }: ImportConfigFormProps) {
  const { t } = useTranslation()
  const [shops, setShops] = useState<AgentShop[]>([])
  const [categories, setCategories] = useState<AgentCategory[]>([])
  const [selectedShop, setSelectedShop] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [maxProducts, setMaxProducts] = useState(5)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [s, c] = await Promise.all([fetchAgentShops(), fetchAgentCategories()])
        if (cancelled) return
        setShops(s)
        setCategories(c)
        if (s.length > 0) setSelectedShop(s[0].id)
        if (c.length > 0) setSelectedCategory(c[0].slug)
      } catch {
        if (!cancelled) setError(t('admin.import.configLoadError'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [t])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedShop || !selectedCategory) return
    onStart(selectedShop, selectedCategory, maxProducts)
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-stone-200 dark:bg-stone-700 rounded-lg" />
        <div className="h-10 bg-stone-200 dark:bg-stone-700 rounded-lg" />
        <div className="h-10 bg-stone-200 dark:bg-stone-700 rounded-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-400 text-sm">
        {error}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormField label={t('admin.import.shop')} required>
        <SelectInput
          value={selectedShop}
          onChange={(e) => setSelectedShop(e.target.value)}
          options={shops.map((s) => ({ value: s.id, label: s.name }))}
          disabled={disabled}
        />
      </FormField>

      <FormField label={t('admin.import.category')} required>
        <SelectInput
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          options={categories.map((c) => ({ value: c.slug, label: c.label }))}
          disabled={disabled}
        />
      </FormField>

      <FormField label={t('admin.import.maxProducts')}>
        <NumberInput
          value={maxProducts}
          onChange={(e) => setMaxProducts(Number(e.target.value))}
          min={1}
          max={50}
          disabled={disabled}
        />
      </FormField>

      <button
        type="submit"
        disabled={disabled || !selectedShop || !selectedCategory}
        className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 dark:disabled:bg-stone-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        {t('admin.import.startImport')}
      </button>
    </form>
  )
}
