import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import { ImportConfigForm } from '@/components/admin/product-import/ImportConfigForm'
import { ImportProgress } from '@/components/admin/product-import/ImportProgress'
import { ImportReviewTable } from '@/components/admin/product-import/ImportReviewTable'
import { ImportResultSummary } from '@/components/admin/product-import/ImportResultSummary'
import { startImportJob, fetchJobStatus, approveImport } from '@/api/admin/agent'
import { useToast } from '@/hooks/useToast'
import type { AgentBulkProduct, BulkProductResponse } from '@/components/admin/types'

type Stage = 'config' | 'progress' | 'review' | 'result'

export default function AdminProductImportPage() {
  const { t } = useTranslation()
  const { addToast } = useToast()

  const [stage, setStage] = useState<Stage>('config')
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobParams, setJobParams] = useState<{ shop: string; category: string; categoryId: string } | null>(null)
  const [products, setProducts] = useState<AgentBulkProduct[]>([])
  const [result, setResult] = useState<BulkProductResponse | null>(null)
  const [approving, setApproving] = useState(false)

  const handleStart = useCallback(async (shop: string, category: string, maxProducts: number) => {
    try {
      const { jobId: id } = await startImportJob({ shop, category, maxProducts })
      setJobId(id)
      setJobParams({ shop, category, categoryId: '' })
      setStage('progress')
    } catch {
      addToast(t('admin.import.errorStart'), 'error')
    }
  }, [addToast, t])

  const handleCompleted = useCallback(async () => {
    if (!jobId) return
    try {
      const job = await fetchJobStatus(jobId)
      if (job.products && job.products.length > 0) {
        setProducts(job.products)
        // Extract categoryId from the first product (all same category in one job)
        const firstCategoryId = job.products[0]?.categoryId
        if (firstCategoryId) {
          setJobParams((prev) => prev ? { ...prev, categoryId: firstCategoryId } : prev)
        }
        setStage('review')
      } else {
        addToast(t('admin.import.noProducts'), 'info')
        setStage('config')
      }
    } catch {
      addToast(t('admin.import.errorFetch'), 'error')
      setStage('config')
    }
  }, [jobId, addToast, t])

  const handleFailed = useCallback((error: string) => {
    addToast(error, 'error')
    setStage('config')
  }, [addToast])

  const handleApprove = useCallback(async (selected: AgentBulkProduct[]) => {
    if (!jobId || !jobParams) return
    setApproving(true)
    try {
      const res = await approveImport(
        jobId,
        selected,
        jobParams.categoryId || selected[0]?.categoryId || '',
        jobParams.shop,
        true,
      )
      setResult(res)
      setStage('result')
    } catch {
      addToast(t('admin.import.errorApprove'), 'error')
    } finally {
      setApproving(false)
    }
  }, [jobId, jobParams, addToast, t])

  const handleReset = useCallback(() => {
    setStage('config')
    setJobId(null)
    setJobParams(null)
    setProducts([])
    setResult(null)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {t('admin.import.title')}
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">{t('admin.import.subtitle')}</p>
        </div>
      </div>

      {/* Stage content */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
        {stage === 'config' && (
          <ImportConfigForm onStart={handleStart} />
        )}

        {stage === 'progress' && jobId && (
          <ImportProgress jobId={jobId} onCompleted={handleCompleted} onFailed={handleFailed} />
        )}

        {stage === 'review' && (
          <ImportReviewTable
            products={products}
            onApprove={handleApprove}
            onDiscard={handleReset}
            approving={approving}
          />
        )}

        {stage === 'result' && result && (
          <ImportResultSummary result={result} onReset={handleReset} />
        )}
      </div>
    </div>
  )
}
