import { useNavigate } from 'react-router-dom'
import { ProductCategories } from '../components/product-recommendations'
import { categories } from '../data/sample-products'

export default function ProductsPage() {
  const navigate = useNavigate()

  return (
    <ProductCategories
      categories={categories}
      onCategorySelect={(categoryId) => navigate(`/products/${categoryId}`)}
    />
  )
}
