import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, X, Pencil, ExternalLink } from 'lucide-react'
import type { AgentBulkProduct } from '../types'
import { TextInput } from '../shared/FormComponents'

interface ImportReviewTableProps {
  products: AgentBulkProduct[]
  onApprove: (selected: AgentBulkProduct[]) => void
  onDiscard: () => void
  approving?: boolean
}

export function ImportReviewTable({ products, onApprove, onDiscard, approving }: ImportReviewTableProps) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<Set<number>>(() => new Set(products.map((_, i) => i)))
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editedProducts, setEditedProducts] = useState<AgentBulkProduct[]>([...products])

  const toggleAll = () => {
    if (selected.size === products.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(products.map((_, i) => i)))
    }
  }

  const toggleOne = (idx: number) => {
    const next = new Set(selected)
    if (next.has(idx)) next.delete(idx)
    else next.add(idx)
    setSelected(next)
  }

  const updateProduct = (idx: number, field: keyof AgentBulkProduct, value: unknown) => {
    setEditedProducts((prev) => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], [field]: value }
      return copy
    })
  }

  const handleApprove = () => {
    const selectedProducts = editedProducts.filter((_, i) => selected.has(i))
    onApprove(selectedProducts)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {t('admin.import.reviewDescription', { count: products.length })}
        </p>
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
          {selected.size}/{products.length} {t('admin.import.selected')}
        </span>
      </div>

      {/* Table */}
      <div className="border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-700">
                <th className="px-3 py-2.5 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === products.length}
                    onChange={toggleAll}
                    className="rounded border-stone-300 dark:border-stone-600 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-stone-600 dark:text-stone-400 w-14">{t('admin.import.colImage')}</th>
                <th className="px-3 py-2.5 text-left font-medium text-stone-600 dark:text-stone-400">{t('admin.import.colName')}</th>
                <th className="px-3 py-2.5 text-left font-medium text-stone-600 dark:text-stone-400 w-36">{t('admin.import.colLabel')}</th>
                <th className="px-3 py-2.5 text-left font-medium text-stone-600 dark:text-stone-400 w-32">{t('admin.import.colWeather')}</th>
                <th className="px-3 py-2.5 text-center font-medium text-stone-600 dark:text-stone-400 w-24">{t('admin.import.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {editedProducts.map((product, idx) => (
                <tr
                  key={product.id}
                  className={`transition-colors ${!selected.has(idx) ? 'opacity-40' : ''} ${editingIdx === idx ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'}`}
                >
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(idx)}
                      onChange={() => toggleOne(idx)}
                      className="rounded border-stone-300 dark:border-stone-600 text-emerald-600 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    {editingIdx === idx ? (
                      <div className="space-y-1">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt=""
                            className="w-10 h-10 object-cover rounded border border-stone-200 dark:border-stone-700"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-stone-100 dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700" />
                        )}
                        <TextInput
                          value={product.imageUrl || ''}
                          onChange={(e) => updateProduct(idx, 'imageUrl', e.target.value)}
                          placeholder="Image URL"
                          className="text-[10px] w-24"
                        />
                      </div>
                    ) : (
                      product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt=""
                          className="w-10 h-10 object-cover rounded border border-stone-200 dark:border-stone-700"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-stone-100 dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700" />
                      )
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {editingIdx === idx ? (
                      <TextInput
                        value={product.name}
                        onChange={(e) => updateProduct(idx, 'name', e.target.value)}
                      />
                    ) : (
                      <span className="font-medium text-stone-900 dark:text-stone-100 line-clamp-2">{product.name}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {editingIdx === idx ? (
                      <TextInput
                        value={product.matchesLabel}
                        onChange={(e) => updateProduct(idx, 'matchesLabel', e.target.value)}
                      />
                    ) : (
                      <span className="text-stone-600 dark:text-stone-400 text-xs">{product.matchesLabel}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="text-xs text-stone-500 dark:text-stone-400 space-y-0.5">
                      {product.weatherTempMin != null && product.weatherTempMax != null && (
                        <div>{product.weatherTempMin}°C – {product.weatherTempMax}°C</div>
                      )}
                      <div className="flex gap-1 flex-wrap">
                        {product.weatherPrecipitation !== 'none' && (
                          <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-[10px]">
                            {product.weatherPrecipitation}
                          </span>
                        )}
                        {product.weatherWind !== 'none' && (
                          <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded text-[10px]">
                            {product.weatherWind}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {product.affiliateUrl && (
                        <a
                          href={product.affiliateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title={t('admin.import.viewProduct')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}
                        className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                        title={editingIdx === idx ? t('admin.import.doneEditing') : t('admin.import.edit')}
                      >
                        {editingIdx === idx ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
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
          disabled={approving || selected.size === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 dark:disabled:bg-stone-700 rounded-lg transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            {approving ? t('admin.import.approving') : t('admin.import.approve', { count: selected.size })}
          </span>
        </button>
      </div>
    </div>
  )
}
