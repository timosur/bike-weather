import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { ProductCategoryDetail, ProductCategoryDetailSkeleton } from '../components/product-recommendations'
import { ProductBreadcrumb } from '../components/product-recommendations/ProductBreadcrumb'
import { fetchZoneCategoryProducts, fetchBikeTypes } from '../api/products'
import type { ProductCategory, Product, Shop, AffiliateDisclosure, BikeType } from '../components/product-recommendations/types'

export default function ZoneCategoryProductsPage() {
  const { t, i18n } = useTranslation()
  const { bikeType, zone, categoryId } = useParams<{
    bikeType: string
    zone: string
    categoryId: string
  }>()
  const navigate = useNavigate()
  const [category, setCategory] = useState<ProductCategory | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [disclosure, setDisclosure] = useState<AffiliateDisclosure | undefined>(undefined)
  const [bikeTypeName, setBikeTypeName] = useState('')
  const [zoneName, setZoneName] = useState('')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!bikeType || !zone || !categoryId) return
    if (!category) setLoading(true)

    Promise.all([
      fetchZoneCategoryProducts(bikeType, zone, categoryId),
      fetchBikeTypes(),
    ])
      .then(([data, btData]) => {
        setCategory(data.category)
        setProducts(data.products)
        setShops(data.shops)
        setDisclosure(data.disclosure ?? undefined)
        const bt = btData.find((b: BikeType) => b.id === bikeType)
        setBikeTypeName(bt?.name ?? bikeType)
        setZoneName(t(`products.zones.${zone}`) || zone)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [bikeType, zone, categoryId, i18n.language])

  if (loading && !category) return <ProductCategoryDetailSkeleton />

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
          onClick={() => navigate(`/products/${bikeType}`)}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
        >
          {t('products.browse.backToZones')}
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
    <>
      <div className="max-w-3xl mx-auto">
        <ProductBreadcrumb
          items={[
            { label: t('products.bikeTypes.heading'), href: '/products' },
            { label: bikeTypeName, href: `/products/${bikeType}` },
            { label: zoneName, href: `/products/${bikeType}` },
            { label: category.name },
          ]}
          onNavigate={(href) => navigate(href)}
        />
      </div>

      <ProductCategoryDetail
        category={category}
        products={products}
        shops={shops}
        disclosure={disclosure!}
        onProductClick={handleProductClick}
      />
    </>
  )
}
