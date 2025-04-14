import { useQuery } from "@tanstack/react-query";
import { 
  getCategories, 
  getCategoryById,
  getProductsByCategory,

  type CategorySearchParams
} from "@/lib/api/category-api";

// Hook to fetch a list of categories with optional filtering
export function useCategories(params?: Partial<CategorySearchParams>) {
  return useQuery({
    queryKey: ["categories", params],
    queryFn: () => getCategories(params),
  });
}

// Hook to fetch a single category by ID
export function useCategory(categoryId: string, locale?: string) {
  return useQuery({
    queryKey: ["category", categoryId, locale],
    queryFn: () => getCategoryById(categoryId),
    enabled: !!categoryId,
  });
}

// Hook to fetch products for a specific category
export function useCategoryProducts(categoryId: string, params?: { page?: number; perPage?: number; locale?: string }) {
  return useQuery({
    queryKey: ["categoryProducts", categoryId, params],
    queryFn: () => getProductsByCategory(categoryId, params),
    enabled: !!categoryId,
  });
}