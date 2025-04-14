"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PromotionType as PrismaPromotionType, PromotionTarget } from '@prisma/client';

// Align with Prisma schema
export type PromotionType = PrismaPromotionType;

export interface Promotion {
  id: string;
  title: string;
  description: string;
  type: PromotionType;
  value: number;
  minPurchaseAmount?: number;
  buyQuantity?: number;
  getQuantity?: number;
  imageUrl?: string;
  badgeType: string;
  colorScheme: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  code?: string;
  promoCode?: string;
  termsAndConditions?: string;
  howToRedeem?: string;
  usageLimit?: number;
  usageCount: number;
  target: PromotionTarget;
  createdAt: string;
  updatedAt: string;
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
    case 'gift':
      return 'Free Gift';
    default:
      return 'Special Offer';
  }
}

export function getBadgeVariant(colorScheme: string): string {
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

// TanStack Query key factories
export const promotionKeys = {
  all: ['promotions'] as const,
  lists: () => [...promotionKeys.all, 'list'] as const,
  list: (filters: any) => [...promotionKeys.lists(), { filters }] as const,
  details: () => [...promotionKeys.all, 'detail'] as const,
  detail: (id: string) => [...promotionKeys.details(), id] as const,
  related: (id: string) => [...promotionKeys.detail(id), 'related'] as const,
  active: () => [...promotionKeys.lists(), 'active'] as const,
};

// API functions to be used with TanStack Query
export const promotionApi = {
  getAll: async (): Promise<Promotion[]> => {
    const response = await fetch('/api/promotions');
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return response.json();
  },
  
  getActive: async (): Promise<{ promotions: Promotion[] }> => {
    const response = await fetch('/api/promotions/active');
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return response.json();
  },
  
  getById: async (id: string): Promise<Promotion> => {
    if (!id) throw new Error('Promotion ID is required');
    
    const response = await fetch(`/api/promotions/${id}`);
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return response.json();
  },
  
  getRelatedProducts: async (promotionId: string): Promise<any[]> => {
    if (!promotionId) throw new Error('Promotion ID is required');
    
    const response = await fetch(`/api/promotions/${promotionId}/related-products`);
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return response.json();
  },
  
  create: async (promotionData: Omit<Promotion, 'id' | 'createdAt' | 'updatedAt'>): Promise<Promotion> => {
    const response = await fetch('/api/promotions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(promotionData),
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  update: async ({ id, data }: { id: string, data: Partial<Promotion> }): Promise<Promotion> => {
    const response = await fetch(`/api/promotions/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  toggleActive: async ({ id, isActive }: { id: string, isActive: boolean }): Promise<Promotion> => {
    const response = await fetch(`/api/promotions/${id}/toggle`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isActive }),
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  delete: async (id: string): Promise<boolean> => {
    const response = await fetch(`/api/promotions/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return true;
  },
};

// TanStack Query hooks
export function useAllPromotions() {
  return useQuery({
    queryKey: promotionKeys.lists(),
    queryFn: promotionApi.getAll,
  });
}

export function useActivePromotions() {
  return useQuery({
    queryKey: promotionKeys.active(),
    queryFn: promotionApi.getActive,
  });
}

export function usePromotion(id: string) {
  return useQuery({
    queryKey: promotionKeys.detail(id),
    queryFn: () => promotionApi.getById(id),
    enabled: !!id,
  });
}

export function useRelatedProducts(promotionId: string) {
  return useQuery({
    queryKey: promotionKeys.related(promotionId),
    queryFn: () => promotionApi.getRelatedProducts(promotionId),
    enabled: !!promotionId,
  });
}

export function useCreatePromotion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: promotionApi.create,
    onSuccess: () => {
      // Invalidate and refetch promotions lists
      queryClient.invalidateQueries({ queryKey: promotionKeys.lists() });
    },
  });
}

export function useUpdatePromotion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: promotionApi.update,
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: promotionKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: promotionKeys.lists() });
    },
  });
}

export function useTogglePromotionActive() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: promotionApi.toggleActive,
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: promotionKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: promotionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: promotionKeys.active() });
    },
  });
}

export function useDeletePromotion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: promotionApi.delete,
    onSuccess: (_data, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: promotionKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: promotionKeys.lists() });
    },
  });
}