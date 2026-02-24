import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProductCategories, ProductCategoriesSkeleton } from '../components/product-recommendations'
import { fetchCategories } from '../api/products'
import type { ProductCategory } from '../components/product-recommendations/types'

export default function ProductsPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <ProductCategoriesSkeleton />

  return (
    <ProductCategories
      categories={categories}
      onCategorySelect={(categoryId) => navigate(`/products/${categoryId}`)}
    />
  )
}
