import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Link } from 'lucide-react'
import { FormField, SelectInput, NumberInput, TextAreaInput } from '../shared/FormComponents'
import type { AgentShop, AgentCategory } from '../types'
import { fetchAgentShops, fetchAgentCategories } from '@/api/admin/agent'

type ImportMode = 'search' | 'urls'

interface ImportConfigFormProps {
  onStart: (shop: string, category: string, maxProducts: number) => void
  onStartUrls: (shop: string, category: string, urls: string[]) => void
  disabled?: boolean
}

export function ImportConfigForm({ onStart, onStartUrls, disabled }: ImportConfigFormProps) {
  const { t } = useTranslation()
  const [shops, setShops] = useState<AgentShop[]>([])
  const [categories, setCategories] = useState<AgentCategory[]>([])
  const [selectedShop, setSelectedShop] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [maxProducts, setMaxProducts] = useState(5)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<ImportMode>('search')
  const [urlsText, setUrlsText] = useState('')

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

  const parseUrls = (text: string): string[] => {
    return text
      .split(/[\n,]/)
      .map((u) => u.trim())
      .filter((u) => u.startsWith('http'))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedShop || !selectedCategory) return

    if (mode === 'urls') {
      const urls = parseUrls(urlsText)
      if (urls.length === 0) return
      onStartUrls(selectedShop, selectedCategory, urls)
    } else {
      onStart(selectedShop, selectedCategory, maxProducts)
    }
  }

  const urlCount = parseUrls(urlsText).length

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
      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg">
        <button
          type="button"
          onClick={() => setMode('search')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'search'
              ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
        >
          <Search className="w-4 h-4" />
          {t('admin.import.modeSearch')}
        </button>
        <button
          type="button"
          onClick={() => setMode('urls')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'urls'
              ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
        >
          <Link className="w-4 h-4" />
          {t('admin.import.modeUrls')}
        </button>
      </div>

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

      {mode === 'search' ? (
        <FormField label={t('admin.import.maxProducts')}>
          <NumberInput
            value={maxProducts}
            onChange={(e) => setMaxProducts(Number(e.target.value))}
            min={1}
            max={50}
            disabled={disabled}
          />
        </FormField>
      ) : (
        <FormField
          label={t('admin.import.productUrls')}
          hint={t('admin.import.urlsHint', { count: urlCount })}
        >
          <TextAreaInput
            value={urlsText}
            onChange={(e) => setUrlsText(e.target.value)}
            placeholder={t('admin.import.urlsPlaceholder')}
            rows={5}
            disabled={disabled}
          />
        </FormField>
      )}

      <button
        type="submit"
        disabled={disabled || !selectedShop || !selectedCategory || (mode === 'urls' && urlCount === 0)}
        className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 dark:disabled:bg-stone-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        {mode === 'urls'
          ? t('admin.import.startUrlImport', { count: urlCount })
          : t('admin.import.startImport')}
      </button>
    </form>
  )
}
