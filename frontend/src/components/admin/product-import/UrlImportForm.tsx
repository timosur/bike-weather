import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { FormField, TextInput } from '../shared/FormComponents'

interface UrlImportFormProps {
  onStart: (url: string) => void
  disabled?: boolean
}

export function UrlImportForm({ onStart, disabled }: UrlImportFormProps) {
  const { t } = useTranslation()
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return

    try {
      const parsed = new URL(trimmed)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setError(t('admin.import.urlImport.invalidUrl'))
        return
      }
    } catch {
      setError(t('admin.import.urlImport.invalidUrl'))
      return
    }

    setError(null)
    onStart(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
        <Globe className="w-4 h-4 mt-0.5 shrink-0" />
        <span>{t('admin.import.urlImport.description')}</span>
      </div>

      <FormField
        label={t('admin.import.urlImport.urlLabel')}
        error={error ?? undefined}
        required
      >
        <TextInput
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(null) }}
          placeholder={t('admin.import.urlImport.urlPlaceholder')}
          disabled={disabled}
          error={!!error}
        />
      </FormField>

      <button
        type="submit"
        disabled={disabled || !url.trim()}
        className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 dark:disabled:bg-stone-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        {t('admin.import.urlImport.extract')}
      </button>
    </form>
  )
}
