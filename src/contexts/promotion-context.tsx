"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Promotion, PromotionType } from '@/hooks/use-promotions';
type ExtendedPromotion = Promotion & {
  products?: { id: string; name: string; price: number }[];
  brands?: { id: string; name: string }[];
  categories?: { id: string; name: string }[];
  models?: { id: string; name: string }[];
};
interface PromotionContextType {
  activePromotions: Promotion[];
  applyPromoCode: (code: string) => Promise<boolean>;
  appliedPromotions: Promotion[];
  removePromotion: (id: string) => void;
  isLoading: boolean;
  error: any;
}

const PromotionContext = createContext<PromotionContextType | undefined>(undefined);

export const PromotionProvider = ({ children }: { children: ReactNode }) => {
  const [appliedPromotions, setAppliedPromotions] = useState<Promotion[]>([]);
  
  // Fetch all active promotions
  const { data, isLoading, error } = useQuery({
    queryKey: ['activePromotions'],
    queryFn: async () => {
      const response = await fetch('/api/promotions/active');
      if (!response.ok) throw new Error('Failed to fetch promotions');
      const data = await response.json();
      return data.promotions || [];
    }
  });
  
  const activePromotions = data || [];
  
  // Apply a promotion code
  const applyPromoCode = async (code: string): Promise<boolean> => {
    try {
      // Check if code is already applied
      if (appliedPromotions.some(promo => promo.code === code || promo.promoCode === code)) {
        return false;
      }
      
      // Validate the code against active promotions
      const matchingPromotion = activePromotions.find(
          (        promo: { code: string; promoCode: string; }) => (promo.code === code || promo.promoCode === code)
      );
      
      if (matchingPromotion) {
        setAppliedPromotions(prev => [...prev, matchingPromotion]);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error applying promotion code:', error);
      return false;
    }
  };
  
  // Remove an applied promotion
  const removePromotion = (id: string) => {
    setAppliedPromotions(promotions => promotions.filter(promo => promo.id !== id));
  };
  
  return (
    <PromotionContext.Provider value={{
      activePromotions,
      applyPromoCode,
      appliedPromotions,
      removePromotion,
      isLoading,
      error
    }}>
      {children}
    </PromotionContext.Provider>
  );
};

export const usePromotion = () => {
  const context = useContext(PromotionContext);
  if (context === undefined) {
    throw new Error('usePromotion must be used within a PromotionProvider');
  }
  return context;
};

// Helper functions for promotions
export function isItemEligibleForPromotion(item: any, promotion: ExtendedPromotion): boolean {
  // If promotion targets specific products
  if (promotion.products && promotion.products.length > 0) {
    return promotion.products.some(product => product.id === item.id);
  }
  
  // If promotion targets specific brands
  if (promotion.brands && promotion.brands.length > 0) {
    return promotion.brands.some(brand => brand.id === item.brandId);
  }
  
  // If promotion targets specific categories
  if ((promotion.categories?.length ?? 0) > 0) {
    return promotion.categories?.some(category => category.id === item.categoryId) ?? false;
  }
  
  // If promotion targets specific models
  if ((promotion.models?.length ?? 0) > 0) {
    return promotion.models?.some(model => model.id === item.modelId) ?? false;
  }
  
  // If no specific targets, promotion applies to all items
  return true;
}

// Calculate discount for a specific item
export function calculateItemDiscount(item: any, promotion: Promotion): number {
  if (!isItemEligibleForPromotion(item, promotion)) return 0;
  
  const itemPrice = item.price * item.quantity;
  
  switch (promotion.type) {
    case 'percentage':
      return itemPrice * (promotion.value / 100);
    
    case 'fixed':
      // For fixed amounts, we distribute proportionally across eligible items
      // This is a simplified approach
      return promotion.value; 
      
    // Add other promotion types as needed
    
    default:
      return 0;
  }
}

// Calculate total discount across all items
export function calculateTotalDiscount(items: any[], promotions: Promotion[]): {
  discountAmount: number; 
  hasFreeShipping: boolean;
} {
  let totalDiscount = 0;
  let hasFreeShipping = false;
  
  for (const promotion of promotions) {
    switch (promotion.type) {
      case 'percentage':
        // Apply percentage discount to eligible items
        items.forEach(item => {
          if (isItemEligibleForPromotion(item, promotion)) {
            totalDiscount += (item.price * item.quantity * promotion.value / 100);
          }
        });
        break;
        
      case 'fixed':
        // Apply fixed amount discount if minimum purchase amount is met
        const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
        if (subtotal >= (promotion.minPurchaseAmount || 0)) {
          totalDiscount += promotion.value;
        }
        break;
      
      case 'free_shipping':
        // Just mark that we have a free shipping promotion
        // The actual shipping discount will be applied in the cart context
        hasFreeShipping = true;
        break;
        
      // Handle other promotion types
      default:
        break;
    }
  }
  
  return {
    discountAmount: totalDiscount,
    hasFreeShipping
  };
}
