import { useParams, useNavigate } from 'react-router-dom'
import { ProductCategoryDetail } from '../components/product-recommendations'
import { categories, products, shops, disclosure } from '../data/sample-products'

export default function ProductCategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()

  const category = categories.find((c) => c.id === categoryId)
  const categoryProducts = products.filter((p) => p.categoryId === categoryId)

  if (!category) {
    return (
      <div className="text-center py-20">
        <h1
          className="text-2xl font-semibold text-stone-800 dark:text-stone-200"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Category not found
        </h1>
        <button
          onClick={() => navigate('/products')}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
        >
          Back to Products
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
      products={categoryProducts}
      shops={shops}
      disclosure={disclosure}
      onProductClick={handleProductClick}
      onBack={() => navigate('/products')}
    />
  )
}
