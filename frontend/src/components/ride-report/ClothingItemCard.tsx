import {
  CircleDashed,
  CloudRain,
  Droplets,
  Eye,
  Footprints,
  Glasses,
  Hand,
  HandMetal,
  HardHat,
  Layers,
  PersonStanding,
  ShieldCheck,
  ShieldHalf,
  ShieldPlus,
  Shirt,
  ThermometerSnowflake,
  ThermometerSun,
  Umbrella,
  Waves,
} from 'lucide-react'
import type { ClothingItem, ClothingIcon } from './types'

function ClothingIconEl({ icon, className }: { icon: ClothingIcon; className?: string }) {
  const cls = className ?? 'w-5 h-5'
  const sw = 1.5

  switch (icon) {
    case 'headband':
      return <CircleDashed className={cls} strokeWidth={sw} />
    case 'helmet-cover':
      return <HardHat className={cls} strokeWidth={sw} />
    case 'sunglasses':
      return <Glasses className={cls} strokeWidth={sw} />
    case 'glasses':
      return <Eye className={cls} strokeWidth={sw} />
    case 'base-layer':
      return <Layers className={cls} strokeWidth={sw} />
    case 'jersey':
    case 'jersey-long':
      return <Shirt className={cls} strokeWidth={sw} />
    case 'vest':
      return <ShieldHalf className={cls} strokeWidth={sw} />
    case 'jacket':
      return <ShieldCheck className={cls} strokeWidth={sw} />
    case 'rain-jacket':
      return <CloudRain className={cls} strokeWidth={sw} />
    case 'arm-warmers':
      return <ThermometerSun className={cls} strokeWidth={sw} />
    case 'pants-short':
    case 'pants-long':
      return <PersonStanding className={cls} strokeWidth={sw} />
    case 'leg-warmers':
      return <ThermometerSnowflake className={cls} strokeWidth={sw} />
    case 'overpants':
      return <ShieldPlus className={cls} strokeWidth={sw} />
    case 'gloves-light':
      return <Hand className={cls} strokeWidth={sw} />
    case 'gloves-warm':
      return <HandMetal className={cls} strokeWidth={sw} />
    case 'gloves-waterproof':
      return <Droplets className={cls} strokeWidth={sw} />
    case 'shoes':
      return <Footprints className={cls} strokeWidth={sw} />
    case 'shoe-covers':
      return <Umbrella className={cls} strokeWidth={sw} />
    case 'socks':
      return <Footprints className={cls} strokeWidth={sw} />
    default:
      return <Shirt className={cls} strokeWidth={sw} />
  }
}

interface ClothingItemCardProps {
  item: ClothingItem
  productLink?: React.ReactNode
}

export function ClothingItemCard({ item, productLink }: ClothingItemCardProps) {
  const hasAlternatives = item.alternatives && item.alternatives.length > 0

  return (
    <div className="rounded-xl bg-white dark:bg-stone-900 ring-1 ring-stone-200 dark:ring-stone-800 p-4 flex flex-col gap-2.5">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-14 h-14 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
          <ClothingIconEl icon={item.icon} className="w-8 h-8" />
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

      {/* Alternatives */}
      {hasAlternatives && (
        <div className="ml-[4.25rem] flex flex-wrap gap-1.5">
          {item.alternatives!.map((alt) => (
            <div
              key={alt.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700"
            >
              <ClothingIconEl icon={alt.icon} className="w-3.5 h-3.5" />
              <span>{alt.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Inline product link */}
      {productLink}
    </div>
  )
}
