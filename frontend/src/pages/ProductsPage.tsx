import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ProductCategories, ProductCategoriesSkeleton } from '../components/product-recommendations'
import { fetchCategories } from '../api/products'
import type { ProductCategory } from '../components/product-recommendations/types'

export default function ProductsPage() {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (categories.length === 0) setLoading(true)
    fetchCategories()
      .then(setCategories)
      .finally(() => setLoading(false))
  }, [i18n.language])

  if (loading && categories.length === 0) return <ProductCategoriesSkeleton />

  return (
    <ProductCategories
      categories={categories}
      onCategorySelect={(categoryId) => navigate(`/products/${categoryId}`)}
    />
  )
}
