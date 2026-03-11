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
  shopId: string;
  affiliateUrl: string;
  matchesZone: string | null;
  matchesItemId: string | null;
  matchesLabel: string;
  bikeTypes: string[];
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

export interface CategoryOverviewItem {
  categoryId: string;
  categoryName: string;
  icon: string;
  zone: string;
  totalProducts: number;
  publishedProducts: number;
  unpublishedProducts: number;
  newestProductAt: string | null;
  oldestProductAt: string | null;
  status: "ok" | "outdated" | "empty";
}

// --- Agent types ---

export interface AgentShop {
  id: string;
  name: string;
}

export interface AgentCategory {
  slug: string;
  categoryId: string;
  label: string;
}

export interface AgentProgressEvent {
  stage: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp?: number;
}

export interface AgentBulkProduct {
  id: string;
  name: string;
  categoryId: string;
  imageUrl: string;
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
}

export interface AgentJob {
  jobId: string;
  shop: string;
  category: string;
  maxProducts: number;
  status: "pending" | "scraping" | "extracting" | "completed" | "failed";
  progress: AgentProgressEvent[];
  products?: AgentBulkProduct[];
  error: string | null;
  createdAt: number;
}
