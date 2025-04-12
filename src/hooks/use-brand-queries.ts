import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getBrands, 
  getBrandById,
  getProductsByBrand,
  type Brand,
  type BrandSearchParams
} from "@/lib/api/brand-api";

// Hook to fetch a list of brands with optional filtering
export function useBrands(params?: Partial<BrandSearchParams>) {
  return useQuery({
    queryKey: ["brands", params],
    queryFn: () => getBrands(params),
  });
}

// Hook to fetch a single brand by ID
export function useBrand(brandId: string) {
  return useQuery({
    queryKey: ["brand", brandId],
    queryFn: () => getBrandById(brandId),
    enabled: !!brandId,
  });
}

// Hook to fetch products for a specific brand
export function useBrandProducts(brandId: string, params?: { page?: number; perPage?: number }) {
  return useQuery({
    queryKey: ["brandProducts", brandId, params],
    queryFn: () => getProductsByBrand(brandId, params),
    enabled: !!brandId,
  });
}