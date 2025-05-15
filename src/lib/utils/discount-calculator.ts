/**
 * Utility functions for discount calculations across the application
 * This serves as a centralized place for all discount logic to ensure consistency
 */

// Import logger if you have one, or use console for now
const logDiscountError = (functionName: string, input: any, error?: Error) => {
  console.error(`Discount Calculator Error [${functionName}]:`, {
    input,
    error: error?.message || 'Invalid input'
  });
};

/**
 * Calculate the discounted price from a base price and discount percentage
 * @param basePrice The original price
 * @param discountPercentage The discount percentage (0-100)
 * @returns The price after discount is applied
 */
export function calculateDiscountedPrice(basePrice: number, discountPercentage: number): number {
  try {
    if (!basePrice || isNaN(basePrice) || basePrice <= 0) {
      if (basePrice !== 0) { // Don't log for legitimate zero price
        logDiscountError('calculateDiscountedPrice', { basePrice, discountPercentage });
      }
      return 0;
    }
    
    if (!discountPercentage || isNaN(discountPercentage) || discountPercentage <= 0) {
      return basePrice;
    }
    
    // Ensure discount percentage is within valid range
    const validDiscount = Math.min(Math.max(0, discountPercentage), 100);
    
    // Calculate discounted price
    const discountAmount = basePrice * (validDiscount / 100);
    return Number((basePrice - discountAmount).toFixed(2));
  } catch (error) {
    logDiscountError('calculateDiscountedPrice', { basePrice, discountPercentage }, error as Error);
    return basePrice; // Safer to return original price than zero on unexpected error
  }
}

/**
 * Calculate the discount amount from a base price and discount percentage
 * @param basePrice The original price
 * @param discountPercentage The discount percentage (0-100) 
 * @returns The amount of the discount
 */
export function calculateDiscountAmount(basePrice: number, discountPercentage: number): number {
  if (!basePrice || isNaN(basePrice) || basePrice <= 0) return 0;
  if (!discountPercentage || isNaN(discountPercentage) || discountPercentage <= 0) return 0;
  
  // Ensure discount percentage is within valid range
  const validDiscount = Math.min(Math.max(0, discountPercentage), 100);
  
  // Calculate discount amount
  return Number((basePrice * (validDiscount / 100)).toFixed(2));
}

/**
 * Calculate the total price after applying multiple discounts
 * This applies discounts sequentially (first product discount, then promotion discount)
 * @param basePrice The original price
 * @param productDiscountPercentage Product-level discount percentage (0-100)
 * @param promotionDiscountPercentage Promotion-level discount percentage (0-100)
 * @returns The price after all discounts are applied
 */
export function calculateTotalDiscountedPrice(
  basePrice: number, 
  productDiscountPercentage: number = 0,
  promotionDiscountPercentage: number = 0
): number {
  // First apply product discount
  const priceAfterProductDiscount = calculateDiscountedPrice(basePrice, productDiscountPercentage);
  
  // Then apply promotion discount on top
  return calculateDiscountedPrice(priceAfterProductDiscount, promotionDiscountPercentage);
}

/**
 * Calculate margin between two prices (useful for retail/wholesale calculations)
 * @param higherPrice The higher price (retail)
 * @param lowerPrice The lower price (wholesale)
 * @returns The margin percentage
 */
export function calculateMarginPercentage(higherPrice: number, lowerPrice: number): number {
  if (!higherPrice || isNaN(higherPrice) || higherPrice <= 0) return 0;
  if (!lowerPrice || isNaN(lowerPrice) || lowerPrice <= 0) return 0;
  if (higherPrice <= lowerPrice) return 0;
  
  const margin = (higherPrice - lowerPrice) / higherPrice * 100;
  return Number(margin.toFixed(1));
} 