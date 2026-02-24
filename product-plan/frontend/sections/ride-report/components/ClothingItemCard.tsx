import { useState } from 'react'
import {
  ArrowLeftRight,
  Glasses,
  Shirt,
  Hand,
  Footprints,
  ShieldCheck,
  CloudRain,
} from 'lucide-react'
import type { ClothingItem, ClothingIcon } from '../types'

function ClothingIconEl({ icon, className }: { icon: ClothingIcon; className?: string }) {
  const cls = className ?? 'w-5 h-5'

  switch (icon) {
    case 'headband':
    case 'helmet-cover':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a8 8 0 0 0-8 8v1h16v-1a8 8 0 0 0-8-8Z" />
          <path d="M4 11v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
        </svg>
      )
    case 'sunglasses':
    case 'glasses':
      return <Glasses className={cls} strokeWidth={1.5} />
    case 'base-layer':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2v4l-4 2v6h16v-6l-4-2V2" />
          <path d="M8 2h8" />
          <path d="M4 14v6h16v-6" />
        </svg>
      )
    case 'jersey':
    case 'jersey-long':
      return <Shirt className={cls} strokeWidth={1.5} />
    case 'vest':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H10L6 6v14h12V6l-4-4Z" />
          <path d="M10 2v4" />
          <path d="M14 2v4" />
        </svg>
      )
    case 'jacket':
    case 'rain-jacket':
      return icon === 'rain-jacket' ? (
        <CloudRain className={cls} strokeWidth={1.5} />
      ) : (
        <ShieldCheck className={cls} strokeWidth={1.5} />
      )
    case 'arm-warmers':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 4h4v16H7z" />
          <path d="M13 4h4v16h-4z" />
          <path d="M7 10h4" />
          <path d="M13 10h4" />
        </svg>
      )
    case 'pants-short':
    case 'pants-long':
    case 'overpants':
    case 'leg-warmers':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d={icon === 'pants-short' || icon === 'leg-warmers'
            ? 'M6 4h12l-1 8h-2l-1 2h-4l-1-2H7z'
            : 'M6 4h12l-1 8h-2l-1 8h-4l-1-8H7z'
          } />
        </svg>
      )
    case 'gloves-light':
    case 'gloves-warm':
    case 'gloves-waterproof':
      return <Hand className={cls} strokeWidth={1.5} />
    case 'shoes':
    case 'shoe-covers':
      return <Footprints className={cls} strokeWidth={1.5} />
    case 'socks':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2v8l-3 4a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4l-3-4V2" />
          <path d="M8 10h8" />
        </svg>
      )
    default:
      return <Shirt className={cls} strokeWidth={1.5} />
  }
}

interface ClothingItemCardProps {
  item: ClothingItem
  /** Optional product link rendered below the item name */
  productLink?: React.ReactNode
  /** Called when the user swaps to an alternative */
  onSwap?: (alternativeId: string) => void
}

export function ClothingItemCard({ item, productLink, onSwap }: ClothingItemCardProps) {
  const [showAlts, setShowAlts] = useState(false)
  const hasAlternatives = item.alternatives && item.alternatives.length > 0

  return (
    <div className="rounded-xl bg-white dark:bg-stone-900 ring-1 ring-stone-200 dark:ring-stone-800 p-4 flex flex-col gap-2.5">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
          <ClothingIconEl icon={item.icon} className="w-5 h-5" />
        </div>

        {/* Name + Reason */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-stone-800 dark:text-stone-200 leading-snug">
            {item.name}
          </span>
          {item.reason && (
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
              {item.reason}
            </p>
          )}
        </div>
      </div>

      {/* Swap button — prominent pill style */}
      {hasAlternatives && !showAlts && (
        <button
          type="button"
          onClick={() => setShowAlts(true)}
          className="self-start ml-13 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 border-dashed border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/40 hover:border-amber-400 dark:hover:border-amber-500 transition-all"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" strokeWidth={2} />
          Alternative available
        </button>
      )}

      {/* Alternatives expanded */}
      {showAlts && hasAlternatives && (
        <div className="ml-13 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Swap for
          </p>
          {item.alternatives!.map((alt) => (
            <button
              key={alt.id}
              type="button"
              onClick={() => {
                onSwap?.(alt.id)
                setShowAlts(false)
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm font-medium border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-700 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
            >
              <div className="w-7 h-7 rounded-md bg-stone-100 dark:bg-stone-700 flex items-center justify-center shrink-0">
                <ClothingIconEl icon={alt.icon} className="w-3.5 h-3.5" />
              </div>
              <span>{alt.name}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowAlts(false)}
            className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Inline product link */}
      {productLink}
    </div>
  )
}
