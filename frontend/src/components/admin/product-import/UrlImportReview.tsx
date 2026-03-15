import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, X, AlertTriangle, ExternalLink, Plus } from 'lucide-react'
import { FormField, TextInput, TextArea, SelectInput } from '../shared/FormComponents'
import { SearchableGroupedSelect } from '../shared/SearchableGroupedSelect'
import { fetchAdminCategories, fetchAdminShops, fetchClothingItems } from '@/api/admin/products'
import type { ClothingItemOption } from '@/api/admin/products'
import type { AdminCategory, AdminShop, SuggestedShop, ExtractedUrlProduct } from '../types'

interface UrlImportReviewProps {
  product: ExtractedUrlProduct
  suggestedCategoryId: string | null
  suggestedShop: SuggestedShop | null
  duplicateOf: { id: string; name: string } | null
  onApprove: (data: {
    product: {
      name: string
      description: string
      imageUrl: string
      affiliateUrl: string
      matchesLabel: string
      matchesItemId: string | null
      bikeTypes: string[]
      weatherTempMin: number | null
      weatherTempMax: number | null
      weatherPrecipitation: string
      weatherWind: string
      weatherSummary: string
    }
    categoryId: string
    shopId: string | null
    newShop: { name: string } | null
  }) => void
  onDiscard: () => void
  approving?: boolean
}

export function UrlImportReview({
  product,
  suggestedCategoryId,
  suggestedShop,
  duplicateOf,
  onApprove,
  onDiscard,
  approving,
}: UrlImportReviewProps) {
  const { t, i18n } = useTranslation()

  // Product fields
  const [name, setName] = useState(product.name)
  const [description, setDescription] = useState(product.description || '')
  const [imageUrl, setImageUrl] = useState(product.imageUrl || '')
  const [affiliateUrl, setAffiliateUrl] = useState(product.affiliateUrl || '')
  const [matchesLabel, setMatchesLabel] = useState(product.matchesLabel || 'Cycling Product')
  const [matchesItemId, setMatchesItemId] = useState(product.matchesItemId || '')
  const [bikeTypes, setBikeTypes] = useState<string[]>(product.bikeTypes || [])
  const [tempMin, setTempMin] = useState<string>(product.weatherTempMin != null ? String(product.weatherTempMin) : '')
  const [tempMax, setTempMax] = useState<string>(product.weatherTempMax != null ? String(product.weatherTempMax) : '')
  const [precipitation, setPrecipitation] = useState(product.weatherPrecipitation || 'none')
  const [wind, setWind] = useState(product.weatherWind || 'none')
  const [weatherSummary, setWeatherSummary] = useState(product.weatherSummary || '')

  // Category & shop
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [shops, setShops] = useState<AdminShop[]>([])
  const [clothingItems, setClothingItems] = useState<ClothingItemOption[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState(suggestedCategoryId || '')
  const [shopMode, setShopMode] = useState<'existing' | 'new'>(suggestedShop?.isNew ? 'new' : 'existing')
  const [selectedShopId, setSelectedShopId] = useState(suggestedShop?.isNew ? '' : (suggestedShop?.id || ''))
  const [newShopName, setNewShopName] = useState(suggestedShop?.isNew ? (suggestedShop.name || '') : '')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [cats, shps, clItems] = await Promise.all([fetchAdminCategories(), fetchAdminShops(), fetchClothingItems(i18n.language)])
        if (cancelled) return
        setCategories(cats)
        setShops(shps)
        setClothingItems(clItems)

        // Set category from suggestion
        if (suggestedCategoryId && cats.some(c => c.id === suggestedCategoryId)) {
          setSelectedCategoryId(suggestedCategoryId)
        } else if (cats.length > 0) {
          setSelectedCategoryId(cats[0].id)
        }

        // Set shop from suggestion
        if (suggestedShop && !suggestedShop.isNew && suggestedShop.id) {
          setSelectedShopId(suggestedShop.id)
          setShopMode('existing')
        } else if (suggestedShop?.isNew) {
          setShopMode('new')
          setNewShopName(suggestedShop.name || '')
          // Also pre-select first existing as fallback
          if (shps.length > 0) setSelectedShopId(shps[0].id)
        } else if (shps.length > 0) {
          setSelectedShopId(shps[0].id)
          setShopMode('existing')
        }
      } catch {
        // Silent fail — fields will be empty
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [suggestedCategoryId, suggestedShop])

  const handleApprove = () => {
    onApprove({
      product: {
        name,
        description,
        imageUrl,
        affiliateUrl,
        matchesLabel,
        matchesItemId: matchesItemId.trim() || null,
        bikeTypes,
        weatherTempMin: tempMin ? Number(tempMin) : null,
        weatherTempMax: tempMax ? Number(tempMax) : null,
        weatherPrecipitation: precipitation,
        weatherWind: wind,
        weatherSummary,
      },
      categoryId: selectedCategoryId,
      shopId: shopMode === 'existing' ? selectedShopId : null,
      newShop: shopMode === 'new' ? { name: newShopName } : null,
    })
  }

  const precipitationOptions = [
    { value: 'none', label: t('admin.import.urlImport.precipNone') },
    { value: 'light-rain', label: t('admin.import.urlImport.precipLightRain') },
    { value: 'heavy-rain', label: t('admin.import.urlImport.precipHeavyRain') },
    { value: 'snow', label: t('admin.import.urlImport.precipSnow') },
  ]

  const windOptions = [
    { value: 'none', label: t('admin.import.urlImport.windNone') },
    { value: 'light-wind', label: t('admin.import.urlImport.windLight') },
    { value: 'strong-wind', label: t('admin.import.urlImport.windStrong') },
  ]

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-stone-200 dark:bg-stone-700 rounded-lg" />
        <div className="h-10 bg-stone-200 dark:bg-stone-700 rounded-lg" />
        <div className="h-32 bg-stone-200 dark:bg-stone-700 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Duplicate warning */}
      {duplicateOf && (
        <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{t('admin.import.urlImport.duplicateWarning', { name: duplicateOf.name })}</span>
        </div>
      )}

      {/* No affiliate tag notice */}
      {suggestedShop && !suggestedShop.hasAffiliateTag && (
        <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{t('admin.import.urlImport.noAffiliateTag')}</span>
        </div>
      )}

      {/* Product image preview + name */}
      <div className="flex gap-4">
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            className="w-24 h-24 object-cover rounded-lg border border-stone-200 dark:border-stone-700 shrink-0"
          />
        )}
        <div className="flex-1 space-y-1">
          <h3 className="font-semibold text-stone-900 dark:text-stone-100">{name}</h3>
          {affiliateUrl && (
            <a
              href={affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              {t('admin.import.viewProduct')}
            </a>
          )}
        </div>
      </div>

      {/* Shop & Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <FormField label={t('admin.import.urlImport.shopLabel')} required>
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShopMode('existing')}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${shopMode === 'existing'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'}`}
                >
                  {t('admin.import.urlImport.existingShop')}
                </button>
                <button
                  type="button"
                  onClick={() => setShopMode('new')}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${shopMode === 'new'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'}`}
                >
                  <Plus className="w-3 h-3" />
                  {t('admin.import.urlImport.newShop')}
                </button>
              </div>
              {shopMode === 'existing' ? (
                <SelectInput
                  value={selectedShopId}
                  onChange={(e) => setSelectedShopId(e.target.value)}
                  options={shops.map((s) => ({ value: s.id, label: s.name }))}
                />
              ) : (
                <TextInput
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  placeholder={t('admin.import.urlImport.shopNamePlaceholder')}
                />
              )}
            </div>
          </FormField>
        </div>

        <FormField label={t('admin.import.category')} required>
          <SearchableGroupedSelect
            value={selectedCategoryId}
            onChange={setSelectedCategoryId}
            placeholder={t('admin.import.urlImport.categorySearch')}
            emptyLabel={t('admin.import.urlImport.categoryEmpty')}
            emptyOptionLabel=""
            groupLabels={{
              head: t('products.zones.head'),
              eyes: t('products.zones.eyes'),
              neck: t('products.zones.neck'),
              upperBody: t('products.zones.upperBody'),
              lowerBody: t('products.zones.lowerBody'),
              hands: t('products.zones.hands'),
              feet: t('products.zones.feet'),
              equipment: t('products.zones.equipment'),
            }}
            options={categories.map((c) => ({
              value: c.id,
              label: c.name,
              group: c.zone,
            }))}
          />
        </FormField>
      </div>

      {/* Product fields */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-stone-700 dark:text-stone-300">
          {t('admin.import.urlImport.productDetails')}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label={t('admin.import.colName')} required>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>

          <FormField label={t('admin.import.colLabel')}>
            <TextInput value={matchesLabel} onChange={(e) => setMatchesLabel(e.target.value)} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label={t('admin.import.urlImport.matchesItemIdLabel')}>
            <SearchableGroupedSelect
              value={matchesItemId}
              onChange={setMatchesItemId}
              placeholder={t('admin.import.urlImport.matchesItemIdSearch')}
              emptyOptionLabel={t('admin.import.urlImport.matchesItemIdNone')}
              emptyLabel={t('admin.import.urlImport.matchesItemIdEmpty')}
              groupLabels={{
                head: t('products.zones.head'),
                eyes: t('products.zones.eyes'),
                neck: t('products.zones.neck'),
                upperBody: t('products.zones.upperBody'),
                lowerBody: t('products.zones.lowerBody'),
                hands: t('products.zones.hands'),
                feet: t('products.zones.feet'),
              }}
              options={clothingItems.map((ci) => ({
                value: ci.id,
                label: ci.name,
                group: ci.zone,
              }))}
            />
          </FormField>

          <FormField label={t('admin.import.urlImport.bikeTypesLabel')}>
            <div className="flex flex-wrap gap-2 pt-1">
              {(['rennrad', 'gravel', 'mtb', 'city'] as const).map((bt) => (
                <label key={bt} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={bikeTypes.includes(bt)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setBikeTypes([...bikeTypes, bt])
                      } else {
                        setBikeTypes(bikeTypes.filter((t) => t !== bt))
                      }
                    }}
                    className="rounded border-stone-300 dark:border-stone-600 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-stone-700 dark:text-stone-300">{t(`admin.import.urlImport.bikeType.${bt}`)}</span>
                </label>
              ))}
            </div>
          </FormField>
        </div>

        <FormField label={t('admin.import.urlImport.descriptionLabel')}>
          <TextArea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label={t('admin.import.urlImport.imageUrlLabel')}>
            <TextInput value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          </FormField>

          <FormField label={t('admin.import.urlImport.affiliateUrlLabel')}>
            <TextInput value={affiliateUrl} onChange={(e) => setAffiliateUrl(e.target.value)} />
          </FormField>
        </div>
      </div>

      {/* Weather fields */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-stone-700 dark:text-stone-300">
          {t('admin.import.colWeather')}
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FormField label={t('admin.import.urlImport.tempMin')}>
            <TextInput
              type="number"
              value={tempMin}
              onChange={(e) => setTempMin(e.target.value)}
              placeholder="°C"
            />
          </FormField>

          <FormField label={t('admin.import.urlImport.tempMax')}>
            <TextInput
              type="number"
              value={tempMax}
              onChange={(e) => setTempMax(e.target.value)}
              placeholder="°C"
            />
          </FormField>

          <FormField label={t('admin.import.urlImport.precipLabel')}>
            <SelectInput
              value={precipitation}
              onChange={(e) => setPrecipitation(e.target.value)}
              options={precipitationOptions}
            />
          </FormField>

          <FormField label={t('admin.import.urlImport.windLabel')}>
            <SelectInput
              value={wind}
              onChange={(e) => setWind(e.target.value)}
              options={windOptions}
            />
          </FormField>
        </div>

        <FormField label={t('admin.import.urlImport.weatherSummaryLabel')}>
          <TextInput value={weatherSummary} onChange={(e) => setWeatherSummary(e.target.value)} />
        </FormField>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-700">
        <button
          onClick={onDiscard}
          disabled={approving}
          className="px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <X className="w-4 h-4" />
            {t('admin.import.discard')}
          </span>
        </button>
        <button
          onClick={handleApprove}
          disabled={approving || !name.trim() || !selectedCategoryId || (shopMode === 'existing' && !selectedShopId) || (shopMode === 'new' && !newShopName.trim())}
          className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 dark:disabled:bg-stone-700 rounded-lg transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            {approving ? t('admin.import.approving') : t('admin.import.urlImport.approveProduct')}
          </span>
        </button>
      </div>
    </div>
  )
}
