import { PromotionType } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
export async function fetchPromotions() {
  try {
    const response = await fetch("/api/promotions");
    if (!response.ok) {
      throw new Error("Failed to fetch promotions");
    }
    const promotions = await response.json();
    return promotions;
  } catch (error) {
    console.error("Error fetching promotions:", error);
    throw error;
  }
}

export async function fetchActivePromotions() {
  try {
    const response = await fetch("/api/promotions/active");
    if (!response.ok) {
      throw new Error("Failed to fetch active promotions");
    }
    const promotions = await response.json();
    return promotions;
  } catch (error) {
    console.error("Error fetching active promotions:", error);
    throw error;
  }
}

export async function fetchRelatedProducts(promotionId: string) {
    try {
        const response = await fetch(`/api/promotions/${promotionId}/related-products`);
        if (!response.ok) {
        throw new Error("Failed to fetch related products");
        }
        const products = await response.json();
        return products;
    } catch (error) {
        console.error("Error fetching related products:", error);
        throw error;
    }
    }
export function usePromotions() {
    return useQuery({
        queryKey: ["promotions"],
        queryFn: fetchPromotions,
    });
    }
export function useActivePromotions() {
    return useQuery({
        queryKey: ["activePromotions"],
        queryFn: fetchActivePromotions,
    });
    }

export function useRelatedProducts(promotionId: string) {
    return useQuery({
        queryKey: ["relatedProducts", promotionId],
        queryFn: () => fetchRelatedProducts(promotionId),
        enabled: !!promotionId, // Only fetch if promotionId is available
    });
    }
// Utility functions for promotions



export function getBadgeVariant(colorScheme: string): string {
    // Map color schemes to badge variants or return a custom class
    switch (colorScheme) {
      case '#4CAF50':
        return 'bg-green-100 text-green-800 border-green-200';
      case '#2196F3':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case '#FFC107':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case '#F44336':
        return 'bg-red-100 text-red-800 border-red-200';
      case '#9C27B0':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  export function isEndingSoon(endDate?: string): boolean {
    if (!endDate) return false;
    
    const end = new Date(endDate);
    const now = new Date();
    
    // Consider "ending soon" if within 7 days of expiration
    const diffTime = end.getTime() - now.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    return diffDays <= 7 && diffDays >= 0;
  }
  
  // Helper functions
export function formatPromotionValue(type: PromotionType, value: number): string {
    switch (type) {
      case 'percentage':
        return `${value}% Off`;
      case 'fixed':
        return `$${value} Off`;
      case 'bogo':
        return value === 1 ? 'Buy One Get One' : `Buy ${value} Get One`;
      case 'free_shipping':
        return 'Free Installation';
      default:
        return 'Special Offer';
    }
  }
  