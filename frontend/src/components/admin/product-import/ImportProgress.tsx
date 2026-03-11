import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react'
import type { AgentProgressEvent } from '../types'
import { createJobEventSource } from '@/api/admin/agent'

interface ImportProgressProps {
  jobId: string
  onCompleted: () => void
  onFailed: (error: string) => void
}

const stageOrder = ['init', 'scraping', 'extracting', 'completed'] as const

function StageIcon({ status }: { status: 'done' | 'active' | 'pending' | 'failed' }) {
  switch (status) {
    case 'done':
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
    case 'active':
      return <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
    case 'failed':
      return <XCircle className="w-5 h-5 text-red-500" />
    case 'pending':
      return <Circle className="w-5 h-5 text-stone-300 dark:text-stone-600" />
  }
}

export function ImportProgress({ jobId, onCompleted, onFailed }: ImportProgressProps) {
  const { t } = useTranslation()
  const [events, setEvents] = useState<AgentProgressEvent[]>([])
  const [currentStage, setCurrentStage] = useState<string>('init')
  const [done, setDone] = useState(false)
  const [failed, setFailed] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let es: EventSource | null = null
    let cancelled = false

    async function connect() {
      es = await createJobEventSource(jobId)
      if (cancelled) { es.close(); return }

      const handleEvent = (stage: string) => (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data) as AgentProgressEvent
          setEvents((prev) => [...prev, { ...data, stage }])
          setCurrentStage(stage)
        } catch {
          // ignore malformed events
        }
      }

      es.addEventListener('init', handleEvent('init'))
      es.addEventListener('scraping', handleEvent('scraping'))
      es.addEventListener('extracting', handleEvent('extracting'))
      es.addEventListener('completed', (e) => {
        handleEvent('completed')(e)
        setDone(true)
        es?.close()
        onCompleted()
      })
      es.addEventListener('failed', (e) => {
        handleEvent('failed')(e)
        setFailed(true)
        es?.close()
        try {
          const data = JSON.parse(e.data)
          onFailed(data.message || 'Import failed')
        } catch {
          onFailed('Import failed')
        }
      })
      es.addEventListener('done', (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.status === 'completed') {
            setDone(true)
            onCompleted()
          } else if (data.status === 'failed') {
            setFailed(true)
            onFailed('Import failed')
          }
        } catch {
          // ignore
        }
        es?.close()
      })
      es.addEventListener('error', () => {
        // EventSource will auto-reconnect; we just close
        es?.close()
        if (!done) {
          setFailed(true)
          onFailed('Connection to agent lost')
        }
      })
    }

    connect()

    return () => { cancelled = true; es?.close() }
  }, [jobId, onCompleted, onFailed, done])

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [events])

  function getStageStatus(stage: string): 'done' | 'active' | 'pending' | 'failed' {
    if (failed && stage === currentStage) return 'failed'
    const currentIdx = stageOrder.indexOf(currentStage as typeof stageOrder[number])
    const stageIdx = stageOrder.indexOf(stage as typeof stageOrder[number])
    if (stageIdx < currentIdx) return 'done'
    if (stageIdx === currentIdx) return done ? 'done' : 'active'
    return 'pending'
  }

  return (
    <div className="space-y-6">
      {/* Stage indicators */}
      <div className="flex items-center gap-2">
        {stageOrder.map((stage, i) => (
          <div key={stage} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <StageIcon status={getStageStatus(stage)} />
              <span className={`text-sm font-medium ${getStageStatus(stage) === 'active' ? 'text-emerald-600 dark:text-emerald-400' :
                getStageStatus(stage) === 'done' ? 'text-stone-700 dark:text-stone-300' :
                  getStageStatus(stage) === 'failed' ? 'text-red-600 dark:text-red-400' :
                    'text-stone-400 dark:text-stone-500'
                }`}>
                {t(`admin.import.stage.${stage}`)}
              </span>
            </div>
            {i < stageOrder.length - 1 && (
              <div className="w-8 h-px bg-stone-200 dark:bg-stone-700" />
            )}
          </div>
        ))}
      </div>

      {/* Live log */}
      <div
        ref={logRef}
        className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-xs space-y-1"
      >
        {events.map((ev, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-stone-400 dark:text-stone-500 shrink-0">
              [{ev.stage}]
            </span>
            <span className="text-stone-700 dark:text-stone-300">{ev.message}</span>
          </div>
        ))}
        {!done && !failed && (
          <div className="flex items-center gap-1 text-stone-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>{t('admin.import.waiting')}</span>
          </div>
        )}
      </div>
    </div>
  )
}
