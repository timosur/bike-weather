import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { History, Clock, CheckCircle, XCircle, Loader2, ChevronRight } from 'lucide-react'
import { fetchJobList } from '@/api/admin/agent'
import type { AgentJob } from '../types'

interface JobHistoryProps {
  onSelectJob: (job: AgentJob) => void
  currentJobId?: string | null
}

export function JobHistory({ onSelectJob, currentJobId }: JobHistoryProps) {
  const { t } = useTranslation()
  const [jobs, setJobs] = useState<AgentJob[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const data = await fetchJobList()
        if (mounted) setJobs(data)
      } catch {
        // Silently fail - job history is non-critical
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [currentJobId]) // Refresh when a job completes

  const getStatusIcon = (status: AgentJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'pending':
      case 'scraping':
      case 'extracting':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Only show jobs with products (completed successfully with extractable results)
  const completedJobsWithProducts = jobs.filter(
    (job) => job.status === 'completed' && job.products && job.products.length > 0
  )

  if (loading) {
    return null // Don't show skeleton, just load silently
  }

  if (completedJobsWithProducts.length === 0) {
    return null // No history to show
  }

  return (
    <div className="border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-stone-50 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300">
          <History className="w-4 h-4" />
          {t('admin.import.jobHistory')}
          <span className="px-1.5 py-0.5 bg-stone-200 dark:bg-stone-700 rounded text-xs">
            {completedJobsWithProducts.length}
          </span>
        </div>
        <ChevronRight
          className={`w-4 h-4 text-stone-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>

      {expanded && (
        <div className="divide-y divide-stone-100 dark:divide-stone-800 max-h-64 overflow-y-auto">
          {completedJobsWithProducts.map((job) => (
            <button
              key={job.jobId}
              onClick={() => onSelectJob(job)}
              disabled={job.jobId === currentJobId}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors ${job.jobId === currentJobId ? 'bg-emerald-50 dark:bg-emerald-900/10' : ''
                }`}
            >
              {getStatusIcon(job.status)}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                  {job.shop} → {job.category}
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  {formatTime(job.createdAt)}
                  <span className="text-stone-400">•</span>
                  {job.products?.length ?? 0} {t('admin.import.productsFound')}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
