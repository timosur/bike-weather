import { apiFetch } from "./client";
import type {
  ProductCategory,
  Product,
  Shop,
  AffiliateDisclosure,
  BikeType,
  Zone,
  ZoneCategoryDetail,
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

export async function fetchCategoryDetail(categoryId: string): Promise<CategoryDetailResponse> {
  return apiFetch<CategoryDetailResponse>(`/products/${categoryId}`);
}

export async function fetchBikeTypes(): Promise<BikeType[]> {
  return apiFetch<BikeType[]>("/products/bike-types");
}

export async function fetchZonesForBikeType(bikeType: string): Promise<Zone[]> {
  return apiFetch<Zone[]>(`/products/browse/${bikeType}/zones`);
}

export async function fetchZoneCategoryProducts(
  bikeType: string,
  zone: string,
  categoryId: string,
): Promise<ZoneCategoryDetail> {
  return apiFetch<ZoneCategoryDetail>(`/products/browse/${bikeType}/${zone}/${categoryId}`);
}
