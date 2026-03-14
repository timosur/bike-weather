import { ExternalLink, Store } from 'lucide-react'

/** Minimal product shape needed for the inline link */
interface InlineProduct {
  id: string;
  name: string;
  imageUrl: string;
  affiliateUrl: string;
}

interface InlineShop {
  name: string;
  affiliateTag?: string | null;
}

interface InlineDisclosure {
  badgeLabel: string;
}

interface InlineProductLinkProps {
  product: InlineProduct;
  shop: InlineShop;
  disclosure: InlineDisclosure;
  onProductClick?: (productId: string) => void;
}

export function InlineProductLink({ product, shop, disclosure, onProductClick }: InlineProductLinkProps) {

  return (
    <a
      href={product.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={() => onProductClick?.(product.id)}
      className="group mt-3 flex items-center gap-3 rounded-lg bg-stone-50 dark:bg-stone-800/60 ring-1 ring-stone-200/80 dark:ring-stone-700/60 p-2.5 hover:ring-emerald-300 dark:hover:ring-emerald-700 transition-all duration-200"
    >
      <div className="w-10 h-10 rounded-md bg-stone-100 dark:bg-stone-700 flex items-center justify-center shrink-0 overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden') }} />
        ) : null}
        <Store className={`w-5 h-5 text-stone-400 dark:text-stone-500${product.imageUrl ? ' hidden' : ''}`} strokeWidth={1.5} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-stone-800 dark:text-stone-200 truncate leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
          {product.name}
        </p>
        <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
          via {shop.name}{shop.affiliateTag ? ' *' : ''}
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {shop.affiliateTag && (
          <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200/60 dark:ring-amber-700/40">
            {disclosure.badgeLabel}
          </span>
        )}
        <ExternalLink className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 group-hover:text-emerald-500 transition-colors" strokeWidth={2} />
      </div>
    </a>
  )
}
