import { z } from "zod";

// Define types for Brand data
export type Brand = {
  id: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  productCount?: number; // Count of products associated with this brand
  createdAt: string;
  updatedAt: string;
};

// Brand search parameters schema
export const BrandSearchParamsSchema = z.object({
  query: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(["name", "productCount", "createdAt"]).default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export type BrandSearchParams = z.infer<typeof BrandSearchParamsSchema>;

// API response type
export type BrandListResponse = {
  brands: Brand[];
  totalCount: number;
  page: number;
  perPage: number;
  totalPages: number;
};

/**
 * Fetch a list of brands with pagination and filtering
 */
export async function getBrands(params?: Partial<BrandSearchParams>): Promise<BrandListResponse> {
  // Construct URL with query parameters
  const searchParams = new URLSearchParams();
  if (params?.query) searchParams.set("query", params.query);
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.perPage) searchParams.set("perPage", params.perPage.toString());
  if (params?.sort) searchParams.set("sort", params.sort);
  if (params?.order) searchParams.set("order", params.order);

  const response = await fetch(`/api/brands?${searchParams.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch brands: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch a single brand by ID
 */
export async function getBrandById(brandId: string): Promise<Brand> {
  const response = await fetch(`/api/brands/${brandId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch brand: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch products by brand ID
 */
export async function getProductsByBrand(brandId: string, params?: { page?: number; perPage?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.perPage) searchParams.set("perPage", params.perPage.toString());

  const response = await fetch(`/api/brands/${brandId}/products?${searchParams.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch brand products: ${response.statusText}`);
  }

  return response.json();
}