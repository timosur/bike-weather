import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, FileText, X, Check } from 'lucide-react'

export interface GpxImportData {
  name: string
  geometry: number[][]
  distanceKm: number
  startLocation: { address?: string; lat: number; lon: number }
  endLocation: { address?: string; lat: number; lon: number }
}

interface GpxImportModalProps {
  open: boolean
  onClose: () => void
  onImport: (data: GpxImportData) => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

const ERROR_KEY_MAP: Record<string, string> = {
  invalid_file: 'errorInvalidFile',
  file_too_large: 'errorTooLarge',
  empty_gpx: 'errorEmpty',
  parse_error: 'errorParseFailed',
}

export function GpxImportModal({ open, onClose, onImport }: GpxImportModalProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GpxImportData | null>(null)

  const reset = () => {
    setFile(null)
    setLoading(false)
    setError(null)
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setResult(null)
    const selected = e.target.files?.[0] ?? null
    if (selected && selected.size > MAX_FILE_SIZE) {
      setError(t('planner.gpxImport.errorTooLarge'))
      setFile(null)
      return
    }
    setFile(selected)
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    setError(null)

    try {
      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/rides/import/gpx', {
        method: 'POST',
        body: form,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const detail = body?.detail as string | undefined
        const key = (detail && ERROR_KEY_MAP[detail]) ?? 'errorNetwork'
        setError(t(`planner.gpxImport.${key}`))
        return
      }

      const data: GpxImportData = await res.json()
      setResult(data)
    } catch {
      setError(t('planner.gpxImport.errorNetwork'))
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (result) {
      onImport(result)
      handleClose()
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
    >
      <div
        className="relative mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('planner.gpxImport.title')}
          </h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Hint */}
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {t('planner.gpxImport.hint')}
        </p>

        {/* File input */}
        {!result && (
          <div className="mb-4">
            <label
              htmlFor="gpx-file-input"
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-6 transition-colors hover:border-blue-400 dark:border-gray-600 dark:hover:border-blue-500"
            >
              <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {file ? file.name : t('planner.gpxImport.selectFile')}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {t('planner.gpxImport.maxSize')}
              </span>
            </label>
            <input
              ref={fileInputRef}
              id="gpx-file-input"
              type="file"
              accept=".gpx"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Success preview */}
        {result && (
          <div className="mb-4 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
              <div className="min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {result.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {result.distanceKm.toFixed(1)} km
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {t('planner.gpxImport.cancel')}
          </button>

          {result ? (
            <button
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Check className="h-4 w-4" />
              {t('planner.gpxImport.apply')}
            </button>
          ) : (
            <button
              onClick={handleImport}
              disabled={!file || loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {t('planner.gpxImport.upload')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
