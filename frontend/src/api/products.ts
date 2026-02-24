import { apiFetch } from "./client";
import type {
  ProductCategory,
  Product,
  Shop,
  AffiliateDisclosure,
} from "../components/product-recommendations/types";

export async function fetchCategories(): Promise<ProductCategory[]> {
  return apiFetch<ProductCategory[]>("/products");
}

interface CategoryDetailResponse {
  category: ProductCategory;
  products: Product[];
  shops: Shop[];
  disclosure: AffiliateDisclosure | null;
}

export async function fetchCategoryDetail(
  categoryId: string
): Promise<CategoryDetailResponse> {
  return apiFetch<CategoryDetailResponse>(`/products/${categoryId}`);
}
