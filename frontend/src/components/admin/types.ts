// Admin types — mirrors backend admin response schemas in camelCase

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminProduct {
  id: string;
  name: string;
  categoryId: string;
  imageUrl: string;
  price: number;
  currency: string;
  shopId: string;
  affiliateUrl: string;
  matchesZone: string | null;
  matchesLabel: string;
  weatherTempMin: number | null;
  weatherTempMax: number | null;
  weatherPrecipitation: string;
  weatherWind: string;
  weatherSummary: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  displayOrder: number;
}

export interface AdminShop {
  id: string;
  name: string;
  logoUrl: string;
  affiliateTag: string | null;
}

export interface AdminFaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAboutContent {
  id: number;
  sectionKey: string;
  title: string;
  body: string;
  imageUrl: string | null;
  displayOrder: number;
  isPublished: boolean;
  updatedAt: string;
}

export interface AdminContactMessage {
  id: number;
  category: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

export interface BulkProductResponse {
  created: number;
  updated: number;
  errors: string[];
}
