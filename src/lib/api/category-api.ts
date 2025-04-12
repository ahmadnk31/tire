import { z } from "zod";

// Define types for Category data
export type Category = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  slug: string;
  parentId?: string | null;
  productCount?: number; // Count of products in this category
  createdAt: string;
  updatedAt: string;
};

// Category search parameters schema
export const CategorySearchParamsSchema = z.object({
  query: z.string().optional(),
  parentId: z.string().optional(), // For getting subcategories
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(["name", "productCount", "createdAt"]).default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export type CategorySearchParams = z.infer<typeof CategorySearchParamsSchema>;

// API response type
export type CategoryListResponse = {
  categories: Category[];
  totalCount: number;
  page: number;
  perPage: number;
  totalPages: number;
};

/**
 * Fetch a list of categories with pagination and filtering
 */
export async function getCategories(params?: Partial<CategorySearchParams>): Promise<CategoryListResponse> {
  // Construct URL with query parameters
  const searchParams = new URLSearchParams();
  if (params?.query) searchParams.set("query", params.query);
  if (params?.parentId) searchParams.set("parentId", params.parentId);
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.perPage) searchParams.set("perPage", params.perPage.toString());
  if (params?.sort) searchParams.set("sort", params.sort);
  if (params?.order) searchParams.set("order", params.order);

  const response = await fetch(`/api/categories?${searchParams.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch a single category by ID
 */
export async function getCategoryById(categoryId: string): Promise<Category> {
  const response = await fetch(`/api/categories/${categoryId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch category: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch a category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category> {
  const response = await fetch(`/api/categories/slug/${slug}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch category: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch products by category ID
 */
export async function getProductsByCategory(categoryId: string, params?: { page?: number; perPage?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.perPage) searchParams.set("perPage", params.perPage.toString());

  const response = await fetch(`/api/categories/${categoryId}/products?${searchParams.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch category products: ${response.statusText}`);
  }

  return response.json();
}