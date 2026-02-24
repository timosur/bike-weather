import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { ProductCategoryDetail, ProductCategoryDetailSkeleton } from '../components/product-recommendations'
import { fetchCategoryDetail } from '../api/products'
import type { ProductCategory, Product, Shop, AffiliateDisclosure } from '../components/product-recommendations/types'

export default function ProductCategoryPage() {
  const { t, i18n } = useTranslation()
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const [category, setCategory] = useState<ProductCategory | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [disclosure, setDisclosure] = useState<AffiliateDisclosure | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!categoryId) return
    setLoading(true)
    fetchCategoryDetail(categoryId)
      .then((data) => {
        setCategory(data.category)
        setProducts(data.products)
        setShops(data.shops)
        setDisclosure(data.disclosure ?? undefined)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [categoryId, i18n.language])

  if (loading) return <ProductCategoryDetailSkeleton />

  if (notFound || !category) {
    return (
      <div className="text-center py-20">
        <h1
          className="text-2xl font-semibold text-stone-800 dark:text-stone-200"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          {t('products.categoryNotFound')}
        </h1>
        <button
          onClick={() => navigate('/products')}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
        >
          {t('products.backToProducts')}
        </button>
      </div>
    )
  }

  const handleProductClick = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (product) {
      window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <ProductCategoryDetail
      category={category}
      products={products}
      shops={shops}
      disclosure={disclosure!}
      onProductClick={handleProductClick}
      onBack={() => navigate('/products')}
    />
  )
}
