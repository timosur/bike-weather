import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Search, Globe } from 'lucide-react'
import { ImportConfigForm } from '@/components/admin/product-import/ImportConfigForm'
import { ImportProgress } from '@/components/admin/product-import/ImportProgress'
import { ImportReviewTable } from '@/components/admin/product-import/ImportReviewTable'
import { ImportResultSummary } from '@/components/admin/product-import/ImportResultSummary'
import { JobHistory } from '@/components/admin/product-import/JobHistory'
import { UrlImportForm } from '@/components/admin/product-import/UrlImportForm'
import { UrlImportReview } from '@/components/admin/product-import/UrlImportReview'
import { startImportJob, startUrlImportJob, fetchJobStatus, approveImport, startExtractUrlJob, approveUrlImport } from '@/api/admin/agent'
import { useToast } from '@/hooks/useToast'
import type { AgentBulkProduct, BulkProductResponse, AgentJob, ExtractedUrlProduct, SuggestedShop, ApproveUrlImportResponse } from '@/components/admin/types'

type ImportTab = 'category' | 'url'
type Stage = 'config' | 'progress' | 'review' | 'result'

export default function AdminProductImportPage() {
  const { t } = useTranslation()
  const { addToast } = useToast()

  const [tab, setTab] = useState<ImportTab>('category')
  const [stage, setStage] = useState<Stage>('config')
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobParams, setJobParams] = useState<{ shop: string; category: string; categoryId: string } | null>(null)
  const [products, setProducts] = useState<AgentBulkProduct[]>([])
  const [result, setResult] = useState<BulkProductResponse | null>(null)
  const [approving, setApproving] = useState(false)

  // URL import state
  const [urlProduct, setUrlProduct] = useState<ExtractedUrlProduct | null>(null)
  const [urlSuggestedCategoryId, setUrlSuggestedCategoryId] = useState<string | null>(null)
  const [urlSuggestedShop, setUrlSuggestedShop] = useState<SuggestedShop | null>(null)
  const [urlDuplicateOf, setUrlDuplicateOf] = useState<{ id: string; name: string } | null>(null)
  const [urlResult, setUrlResult] = useState<ApproveUrlImportResponse | null>(null)

  // --- Category import handlers ---

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

  const handleStartUrls = useCallback(async (shop: string, category: string, urls: string[]) => {
    try {
      const { jobId: id } = await startUrlImportJob({ shop, category, urls })
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

      // Handle extract-url jobs differently
      if (job.suggestedCategoryId !== undefined) {
        const prod = job.products?.[0]
        if (prod) {
          setUrlProduct(prod as unknown as ExtractedUrlProduct)
          setUrlSuggestedCategoryId(job.suggestedCategoryId ?? null)
          setUrlSuggestedShop(job.suggestedShop ?? null)
          setUrlDuplicateOf(job.duplicateOf ?? null)
          setStage('review')
        } else {
          addToast(t('admin.import.noProducts'), 'info')
          setStage('config')
        }
        return
      }

      if (job.products && job.products.length > 0) {
        setProducts(job.products)
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

  // --- URL import handlers ---

  const handleStartUrlExtract = useCallback(async (url: string) => {
    try {
      const { jobId: id } = await startExtractUrlJob(url)
      setJobId(id)
      setStage('progress')
    } catch {
      addToast(t('admin.import.errorStart'), 'error')
    }
  }, [addToast, t])

  const handleApproveUrlImport = useCallback(async (data: {
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
  }) => {
    if (!jobId) return
    setApproving(true)
    try {
      const res = await approveUrlImport(jobId, data)
      setUrlResult(res)
      setStage('result')
    } catch {
      addToast(t('admin.import.errorApprove'), 'error')
    } finally {
      setApproving(false)
    }
  }, [jobId, addToast, t])

  const handleReset = useCallback(() => {
    setStage('config')
    setJobId(null)
    setJobParams(null)
    setProducts([])
    setResult(null)
    setUrlProduct(null)
    setUrlSuggestedCategoryId(null)
    setUrlSuggestedShop(null)
    setUrlDuplicateOf(null)
    setUrlResult(null)
  }, [])

  const handleSelectJob = useCallback((job: AgentJob) => {
    if (job.products && job.products.length > 0) {
      setJobId(job.jobId)
      setJobParams({ shop: job.shop, category: job.category, categoryId: job.products[0]?.categoryId || '' })
      setProducts(job.products)
      setStage('review')
    }
  }, [])

  const isUrlImportReview = tab === 'url' && urlProduct && stage === 'review'
  const isUrlImportResult = tab === 'url' && urlResult && stage === 'result'

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

      {/* Tab toggle */}
      {stage === 'config' && (
        <div className="flex gap-2 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg">
          <button
            type="button"
            onClick={() => { setTab('category'); handleReset() }}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'category'
              ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
          >
            <Search className="w-4 h-4" />
            {t('admin.import.urlImport.tabCategory')}
          </button>
          <button
            type="button"
            onClick={() => { setTab('url'); handleReset() }}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'url'
              ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
          >
            <Globe className="w-4 h-4" />
            {t('admin.import.urlImport.tabUrl')}
          </button>
        </div>
      )}

      {/* Stage content */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
        {stage === 'config' && tab === 'category' && (
          <div className="space-y-6">
            <ImportConfigForm onStart={handleStart} onStartUrls={handleStartUrls} />
            <JobHistory onSelectJob={handleSelectJob} currentJobId={jobId} />
          </div>
        )}

        {stage === 'config' && tab === 'url' && (
          <UrlImportForm onStart={handleStartUrlExtract} />
        )}

        {stage === 'progress' && jobId && (
          <ImportProgress jobId={jobId} onCompleted={handleCompleted} onFailed={handleFailed} />
        )}

        {stage === 'review' && !isUrlImportReview && (
          <ImportReviewTable
            products={products}
            onApprove={handleApprove}
            onDiscard={handleReset}
            approving={approving}
          />
        )}

        {isUrlImportReview && urlProduct && (
          <UrlImportReview
            product={urlProduct}
            suggestedCategoryId={urlSuggestedCategoryId}
            suggestedShop={urlSuggestedShop}
            duplicateOf={urlDuplicateOf}
            onApprove={handleApproveUrlImport}
            onDiscard={handleReset}
            approving={approving}
          />
        )}

        {stage === 'result' && !isUrlImportResult && result && (
          <ImportResultSummary result={result} onReset={handleReset} />
        )}

        {isUrlImportResult && urlResult && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <div className="text-emerald-600 dark:text-emerald-400 text-sm">
                <p className="font-medium">{t('admin.import.urlImport.successMessage')}</p>
                <p className="mt-1 text-stone-600 dark:text-stone-400">
                  {urlResult.product.name}
                  {urlResult.shopCreated && (
                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                      ({t('admin.import.urlImport.shopCreated')})
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              {t('admin.import.startNew')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
