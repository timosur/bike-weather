import { useState, useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { SearchFilterBar } from '@/components/admin/shared/SearchFilterBar'
import { SlidePanel } from '@/components/admin/shared/SlidePanel'
import { FormField, TextInput, TextArea, SelectInput } from '@/components/admin/shared/FormComponents'
import { StatusBadge } from '@/components/admin/shared/StatusBadge'
import { useToast } from '@/hooks/useToast'
import { fetchAdminItems, updateAdminItem } from '@/api/admin/items'
import type { AdminRecommendationItem, AdminRecommendationItemUpdate } from '@/components/admin/types'

const ZONE_OPTIONS = [
  'upper-body', 'lower-body', 'hands', 'head', 'feet', 'eyes', 'neck', 'equipment',
] as const

export default function AdminItemsPage() {
  const { t, i18n } = useTranslation()
  const { addToast } = useToast()
  const lang = i18n.language === 'en' ? 'en' : 'de'

  const [items, setItems] = useState<AdminRecommendationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [zoneFilter, setZoneFilter] = useState<string>('')

  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<AdminRecommendationItem | null>(null)
  const [form, setForm] = useState<AdminRecommendationItemUpdate>({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await fetchAdminItems(typeFilter || undefined, zoneFilter || undefined))
    } catch {
      addToast(t('admin.items.loadError'), 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast, t, typeFilter, zoneFilter])

  useEffect(() => { load() }, [load])

  // Flatten for search: generics + their variants
  const filtered = useMemo(() => {
    if (!search) return items
    const q = search.toLowerCase()
    return items.reduce<AdminRecommendationItem[]>((acc, item) => {
      const nameMatch = (lang === 'en' ? item.nameEn : item.nameDe).toLowerCase().includes(q)
      const idMatch = item.id.toLowerCase().includes(q)
      const matchedVariants = item.variants?.filter(v =>
        (lang === 'en' ? v.nameEn : v.nameDe).toLowerCase().includes(q) || v.id.toLowerCase().includes(q)
      )
      if (nameMatch || idMatch) {
        acc.push(item)
      } else if (matchedVariants && matchedVariants.length > 0) {
        acc.push({ ...item, variants: matchedVariants })
      }
      return acc
    }, [])
  }, [items, search, lang])

  const totalCount = useMemo(() =>
    items.reduce((sum, i) => sum + 1 + (i.variants?.length ?? 0), 0),
    [items],
  )

  const openEdit = (item: AdminRecommendationItem) => {
    setEditing(item)
    setForm({
      nameDe: item.nameDe,
      nameEn: item.nameEn,
      reasonDe: item.reasonDe,
      reasonEn: item.reasonEn,
      zone: item.zone,
      icon: item.icon,
    })
    setPanelOpen(true)
  }

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await updateAdminItem(editing.id, form)
      addToast(t('admin.items.saved'))
      setPanelOpen(false)
      load()
    } catch {
      addToast(t('admin.items.saveError'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const getName = (item: AdminRecommendationItem) =>
    lang === 'en' ? item.nameEn : item.nameDe

  const zoneLabel = (zone: string) => t(`admin.items.zone.${zone}`, zone)

  return (
    <div>
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {t('admin.items.title')}
        </h1>
        <span className="text-sm text-stone-500 dark:text-stone-400">
          {t('admin.items.totalCount', { count: totalCount })}
        </span>
      </div>

      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('admin.items.searchPlaceholder')}
        filters={
          <>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <option value="">{t('admin.items.allTypes')}</option>
              <option value="clothing">{t('admin.items.typeClothing')}</option>
              <option value="equipment">{t('admin.items.typeEquipment')}</option>
            </select>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <option value="">{t('admin.items.allZones')}</option>
              {ZONE_OPTIONS.map((z) => (
                <option key={z} value={z}>{zoneLabel(z)}</option>
              ))}
            </select>
          </>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-stone-100 dark:bg-stone-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-stone-500 dark:text-stone-400">
          {t('admin.items.noItems')}
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_100px_120px_100px_40px] gap-3 px-4 py-2.5 text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider border-b border-stone-200 dark:border-stone-800">
            <span>{t('admin.items.colName')}</span>
            <span>{t('admin.items.colType')}</span>
            <span>{t('admin.items.colZone')}</span>
            <span>{t('admin.items.colIcon')}</span>
            <span />
          </div>

          {filtered.map((item) => (
            <div key={item.id}>
              {/* Generic/parent row */}
              <button
                onClick={() => openEdit(item)}
                className="w-full grid grid-cols-[1fr_100px_120px_100px_40px] gap-3 px-4 py-3 items-center text-left hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors border-b border-stone-100 dark:border-stone-800/50"
              >
                <div>
                  <span className="font-medium text-sm text-stone-900 dark:text-stone-100">{getName(item)}</span>
                  <span className="ml-2 text-xs text-stone-400 font-mono">{item.id}</span>
                </div>
                <StatusBadge variant={item.type === 'clothing' ? 'success' : 'neutral'}>
                  {t(`admin.items.type${item.type === 'clothing' ? 'Clothing' : 'Equipment'}`)}
                </StatusBadge>
                <span className="text-sm text-stone-600 dark:text-stone-300">{zoneLabel(item.zone)}</span>
                <span className="text-lg" title={item.icon}>{item.icon}</span>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>

              {/* Variant rows */}
              {item.variants?.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => openEdit(variant)}
                  className="w-full grid grid-cols-[1fr_100px_120px_100px_40px] gap-3 px-4 py-2.5 pl-10 items-center text-left hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors border-b border-stone-100 dark:border-stone-800/50 bg-stone-50/50 dark:bg-stone-800/20"
                >
                  <div>
                    <span className="text-sm text-stone-700 dark:text-stone-300">{getName(variant)}</span>
                    <span className="ml-2 text-xs text-stone-400 font-mono">{variant.id}</span>
                  </div>
                  <StatusBadge variant={variant.type === 'clothing' ? 'success' : 'neutral'}>
                    {t(`admin.items.type${variant.type === 'clothing' ? 'Clothing' : 'Equipment'}`)}
                  </StatusBadge>
                  <span className="text-sm text-stone-500 dark:text-stone-400">{zoneLabel(variant.zone)}</span>
                  <span className="text-lg" title={variant.icon}>{variant.icon}</span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      <SlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editing ? getName(editing) : ''}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setPanelOpen(false)}
              className="px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              {t('admin.items.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {saving ? t('admin.items.saving') : t('admin.items.save')}
            </button>
          </div>
        }
      >
        {editing && (
          <div className="space-y-5">
            {/* Read-only metadata */}
            <div className="rounded-lg bg-stone-50 dark:bg-stone-800 p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                <span className="font-medium">{t('admin.items.fieldId')}:</span>
                <code className="font-mono text-stone-700 dark:text-stone-300">{editing.id}</code>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                <span className="font-medium">{t('admin.items.colType')}:</span>
                <span className="text-stone-700 dark:text-stone-300">{t(`admin.items.type${editing.type === 'clothing' ? 'Clothing' : 'Equipment'}`)}</span>
              </div>
              {editing.parentId && (
                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                  <span className="font-medium">{t('admin.items.fieldParent')}:</span>
                  <code className="font-mono text-stone-700 dark:text-stone-300">{editing.parentId}</code>
                </div>
              )}
            </div>

            <div className="border-t border-stone-200 dark:border-stone-800 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">
                {t('admin.items.sectionTranslations')}
              </h3>
              <div className="space-y-4">
                <FormField label={t('admin.items.fieldNameDe')}>
                  <TextInput
                    value={form.nameDe ?? ''}
                    onChange={(e) => setForm({ ...form, nameDe: e.target.value })}
                  />
                </FormField>
                <FormField label={t('admin.items.fieldNameEn')}>
                  <TextInput
                    value={form.nameEn ?? ''}
                    onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                  />
                </FormField>
                <FormField label={t('admin.items.fieldReasonDe')}>
                  <TextArea
                    value={form.reasonDe ?? ''}
                    onChange={(e) => setForm({ ...form, reasonDe: e.target.value })}
                    rows={2}
                  />
                </FormField>
                <FormField label={t('admin.items.fieldReasonEn')}>
                  <TextArea
                    value={form.reasonEn ?? ''}
                    onChange={(e) => setForm({ ...form, reasonEn: e.target.value })}
                    rows={2}
                  />
                </FormField>
              </div>
            </div>

            <div className="border-t border-stone-200 dark:border-stone-800 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">
                {t('admin.items.sectionDisplay')}
              </h3>
              <div className="space-y-4">
                <FormField label={t('admin.items.fieldZone')}>
                  <SelectInput
                    value={form.zone ?? ''}
                    onChange={(e) => setForm({ ...form, zone: e.target.value })}
                    options={ZONE_OPTIONS.map((z) => ({ value: z, label: zoneLabel(z) }))}
                  />
                </FormField>
                <FormField label={t('admin.items.fieldIcon')}>
                  <TextInput
                    value={form.icon ?? ''}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    placeholder="🧥"
                  />
                </FormField>
              </div>
            </div>

            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {t('admin.items.reasonHint')}
              </p>
            </div>
          </div>
        )}
      </SlidePanel>
    </div>
  )
}
