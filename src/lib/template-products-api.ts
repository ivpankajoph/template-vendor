import { NEXT_PUBLIC_API_URL } from "@/config/variables";

const API_BASE = String(NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export type TemplateProductsFilters = {
  vendorId: string;
  websiteId?: string;
  city?: string;
  search?: string;
  category?: string;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  discount?: number;
  sort?: string;
  page?: number;
  limit?: number;
};

export type TemplateProductFacet = {
  id?: string;
  label: string;
  count: number;
};

export type TemplateProductsResponse = {
  products: any[];
  facets?: {
    categories?: TemplateProductFacet[];
    brands?: TemplateProductFacet[];
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const appendParam = (params: URLSearchParams, key: string, value: unknown) => {
  const text = String(value ?? "").trim();
  if (text) params.set(key, text);
};

export async function fetchTemplateProducts({
  vendorId,
  websiteId,
  city,
  search,
  category,
  brands,
  minPrice,
  maxPrice,
  rating,
  discount,
  sort,
  page = 1,
  limit = 24,
}: TemplateProductsFilters): Promise<TemplateProductsResponse> {
  const normalizedVendorId = String(vendorId || "").trim();
  if (!API_BASE || !normalizedVendorId) {
    return { products: [] };
  }

  const params = new URLSearchParams();
  appendParam(params, "city", city || "all");
  appendParam(params, "website_id", websiteId);
  appendParam(params, "search", search);
  appendParam(params, "category", category && category !== "All" ? category : "");
  appendParam(params, "brands", Array.isArray(brands) ? brands.join(",") : "");
  appendParam(params, "minPrice", minPrice && minPrice > 0 ? minPrice : "");
  appendParam(params, "maxPrice", maxPrice && maxPrice > 0 ? maxPrice : "");
  appendParam(params, "rating", rating && rating > 0 ? rating : "");
  appendParam(params, "discount", discount && discount > 0 ? discount : "");
  appendParam(params, "sort", sort);
  appendParam(params, "page", page);
  appendParam(params, "limit", limit);

  const response = await fetch(
    `${API_BASE}/templates/${encodeURIComponent(normalizedVendorId)}/products?${params.toString()}`,
    { cache: "no-store" }
  );

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || "Failed to fetch products");
  }

  return {
    products: Array.isArray(payload?.products) ? payload.products : [],
    facets: payload?.facets || {},
    pagination: payload?.pagination,
  };
}
