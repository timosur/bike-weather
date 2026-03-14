import { apiFetch } from "../client";
import type {
  PaginatedResponse,
  AdminProduct,
  AdminCategory,
  AdminShop,
  BulkProductResponse,
  CategoryOverviewItem,
} from "@/components/admin/types";

// --- Products ---

export function fetchProductOverview(): Promise<CategoryOverviewItem[]> {
  return apiFetch("/admin/products/overview");
}

export function fetchAdminProducts(
  page = 1,
  pageSize = 50,
  search?: string,
  categoryId?: string,
  shopId?: string,
  isPublished?: boolean,
): Promise<PaginatedResponse<AdminProduct>> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (search) params.set("search", search);
  if (categoryId) params.set("category_id", categoryId);
  if (shopId) params.set("shop_id", shopId);
  if (isPublished !== undefined) params.set("is_published", String(isPublished));
  return apiFetch(`/admin/products?${params}`);
}

export function fetchAdminProduct(id: string): Promise<AdminProduct> {
  return apiFetch(`/admin/products/${id}`);
}

export function createProduct(data: Partial<AdminProduct>): Promise<AdminProduct> {
  return apiFetch("/admin/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateProduct(id: string, data: Partial<AdminProduct>): Promise<AdminProduct> {
  return apiFetch(`/admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteProduct(id: string): Promise<void> {
  return apiFetch(`/admin/products/${id}`, { method: "DELETE" });
}

export function bulkImportProducts(items: Partial<AdminProduct>[]): Promise<BulkProductResponse> {
  return apiFetch("/admin/products/bulk", {
    method: "POST",
    body: JSON.stringify(items),
  });
}

// --- Categories ---

export function fetchAdminCategories(): Promise<AdminCategory[]> {
  return apiFetch("/admin/categories");
}

export function createCategory(data: Partial<AdminCategory>): Promise<AdminCategory> {
  return apiFetch("/admin/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCategory(id: string, data: Partial<AdminCategory>): Promise<AdminCategory> {
  return apiFetch(`/admin/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// --- Shops ---

export function fetchAdminShops(): Promise<AdminShop[]> {
  return apiFetch("/admin/shops");
}

export function createShop(data: Partial<AdminShop>): Promise<AdminShop> {
  return apiFetch("/admin/shops", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateShop(id: string, data: Partial<AdminShop>): Promise<AdminShop> {
  return apiFetch(`/admin/shops/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// --- Clothing Items ---

export function fetchClothingItems(locale: string = "de"): Promise<{ id: string; name: string }[]> {
  return apiFetch(`/admin/clothing-items?locale=${encodeURIComponent(locale)}`);
}
