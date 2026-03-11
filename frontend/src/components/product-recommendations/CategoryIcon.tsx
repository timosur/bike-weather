import type { CategoryIcon as CategoryIconType } from './types'

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
    case 'rain-jacket':
      return (
        <svg {...props}>
          <path d="M12 2L8 6v4l-4 2v6l4 2v2h8v-2l4-2v-6l-4-2V6l-4-4z" />
          <path d="M8 6h8" />
          <path d="M9 14l1 2M12 13l1 2M15 14l1 2" strokeWidth={1} />
        </svg>
      )
    case 'jersey':
      return (
        <svg {...props}>
          <path d="M8 2l-4 4v4l4 2v8h8v-8l4-2V6l-4-4" />
          <path d="M8 2h8" />
          <path d="M10 12h4" />
        </svg>
      )
    case 'base-layer':
      return (
        <svg {...props}>
          <path d="M9 2h6v2l3 2v4l-3 1v9H9v-9L6 10V6l3-2z" />
          <path d="M9 4h6" strokeDasharray="2 1" />
        </svg>
      )
    case 'vest':
      return (
        <svg {...props}>
          <path d="M9 4h6l3 3v5l-3 1v7H9v-7L6 12V7z" />
          <path d="M9 4v16M15 4v16" strokeWidth={1} />
        </svg>
      )
    case 'pants-long':
      return (
        <svg {...props}>
          <path d="M8 2h8l-1 10h-1l-1 8h-2l-1-8H9z" />
        </svg>
      )
    case 'pants-short':
      return (
        <svg {...props}>
          <path d="M8 2h8l-1 8H9z" />
        </svg>
      )
    case 'overpants':
      return (
        <svg {...props}>
          <path d="M8 2h8l-1 10h-1l-1 8h-2l-1-8H9z" />
          <path d="M8 6l1 2M16 6l-1 2M9 12l1 2M15 12l-1 2" strokeWidth={1} />
        </svg>
      )
    case 'gloves-waterproof':
      return (
        <svg {...props}>
          <path d="M18 11V6a2 2 0 0 0-4 0v1M14 7V4a2 2 0 0 0-4 0v4M10 8V5a2 2 0 0 0-4 0v7" />
          <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8H9a8 8 0 0 1-3-15.4" />
          <path d="M7 17l1 1M10 16l1 1" strokeWidth={1} />
        </svg>
      )
    case 'gloves-light':
      return (
        <svg {...props}>
          <path d="M18 11V6a2 2 0 0 0-4 0v1M14 7V4a2 2 0 0 0-4 0v4M10 8V5a2 2 0 0 0-4 0v7" />
          <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8H9a8 8 0 0 1-3-15.4" />
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
    case 'shoe-covers':
      return (
        <svg {...props}>
          <path d="M3 16h18v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2z" />
          <path d="M3 16l2-10h4l1 4h4l7 6" />
          <path d="M5 12l2 1M8 11l2 1M14 14l2 1" strokeWidth={1} />
        </svg>
      )
    case 'eyewear':
      return (
        <svg {...props}>
          <path d="M2 12c0-2 3-5 5-5h1.5a3 3 0 0 1 3 0h1a3 3 0 0 1 3 0H17c2 0 5 3 5 5s-3 5-5 5h-1a3 3 0 0 1-5 0h-1a3 3 0 0 1-5 0H4c-2 0-2-3-2-5z" />
        </svg>
      )
    case 'neck-gaiter':
      return (
        <svg {...props}>
          <ellipse cx="12" cy="8" rx="5" ry="3" />
          <path d="M7 8v6c0 2.5 2.2 4 5 4s5-1.5 5-4V8" />
          <path d="M7 12c0 1 2.2 2 5 2s5-1 5-2" />
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
