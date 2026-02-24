import type { CategoryIcon as CategoryIconType } from '../types'

interface CategoryIconProps {
  icon: CategoryIconType
  className?: string
}

export function CategoryIcon({ icon, className = 'w-6 h-6' }: CategoryIconProps) {
  const props = { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  switch (icon) {
    case 'jacket':
      return (
        <svg {...props}>
          <path d="M12 2L8 6v4l-4 2v6l4 2v2h8v-2l4-2v-6l-4-2V6l-4-4z" />
          <path d="M8 6h8" />
        </svg>
      )
    case 'gloves':
      return (
        <svg {...props}>
          <path d="M18 11V6a2 2 0 0 0-4 0v1M14 7V4a2 2 0 0 0-4 0v4M10 8V5a2 2 0 0 0-4 0v7" />
          <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8H9a8 8 0 0 1-3-15.4" />
        </svg>
      )
    case 'pants':
      return (
        <svg {...props}>
          <path d="M6 4h12l-1 8h-2l-1 8h-4l-1-8H7z" />
        </svg>
      )
    case 'headwear':
      return (
        <svg {...props}>
          <path d="M12 3C8 3 4 5.5 4 9.5c0 2 1 3.5 2 4.5H18c1-1 2-2.5 2-4.5C20 5.5 16 3 12 3z" />
          <path d="M4 14h16" />
          <path d="M3 17h18" />
        </svg>
      )
    case 'shoes':
      return (
        <svg {...props}>
          <path d="M3 16h18v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2z" />
          <path d="M3 16l2-10h4l1 4h4l7 6" />
        </svg>
      )
    case 'light':
      return (
        <svg {...props}>
          <circle cx="12" cy="10" r="4" />
          <path d="M12 2v2M12 18v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      )
    case 'accessories':
      return (
        <svg {...props}>
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      )
  }
}
