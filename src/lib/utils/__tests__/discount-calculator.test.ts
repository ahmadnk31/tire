import {
  calculateDiscountedPrice,
  calculateDiscountAmount,
  calculateTotalDiscountedPrice,
  calculateMarginPercentage
} from '../discount-calculator';

describe('Discount Calculator', () => {
  describe('calculateDiscountedPrice', () => {
    it('should return the correct discounted price', () => {
      expect(calculateDiscountedPrice(100, 20)).toBe(80);
      expect(calculateDiscountedPrice(50, 10)).toBe(45);
      expect(calculateDiscountedPrice(75.50, 15)).toBe(64.18);
    });

    it('should handle edge cases', () => {
      // Zero or negative base price
      expect(calculateDiscountedPrice(0, 20)).toBe(0);
      expect(calculateDiscountedPrice(-10, 20)).toBe(0);

      // Zero, negative, or excessive discount
      expect(calculateDiscountedPrice(100, 0)).toBe(100);
      expect(calculateDiscountedPrice(100, -5)).toBe(100);
      expect(calculateDiscountedPrice(100, 120)).toBe(0); // Cap at 100%

      // NaN inputs
      expect(calculateDiscountedPrice(NaN, 20)).toBe(0);
      expect(calculateDiscountedPrice(100, NaN)).toBe(100);
    });
  });

  describe('calculateDiscountAmount', () => {
    it('should return the correct discount amount', () => {
      expect(calculateDiscountAmount(100, 20)).toBe(20);
      expect(calculateDiscountAmount(50, 10)).toBe(5);
      expect(calculateDiscountAmount(75.50, 15)).toBe(11.33);
    });

    it('should handle edge cases', () => {
      // Zero or negative base price
      expect(calculateDiscountAmount(0, 20)).toBe(0);
      expect(calculateDiscountAmount(-10, 20)).toBe(0);

      // Zero, negative, or excessive discount
      expect(calculateDiscountAmount(100, 0)).toBe(0);
      expect(calculateDiscountAmount(100, -5)).toBe(0);
      expect(calculateDiscountAmount(100, 120)).toBe(100);

      // NaN inputs
      expect(calculateDiscountAmount(NaN, 20)).toBe(0);
      expect(calculateDiscountAmount(100, NaN)).toBe(0);
    });
  });

  describe('calculateTotalDiscountedPrice', () => {
    it('should apply discounts sequentially', () => {
      // 100 - 20% = 80, then 80 - 10% = 72
      expect(calculateTotalDiscountedPrice(100, 20, 10)).toBe(72);
      
      // 200 - 15% = 170, then 170 - 25% = 127.50
      expect(calculateTotalDiscountedPrice(200, 15, 25)).toBe(127.5);
    });

    it('should handle missing discount parameters', () => {
      expect(calculateTotalDiscountedPrice(100)).toBe(100);
      expect(calculateTotalDiscountedPrice(100, 20)).toBe(80);
    });
  });

  describe('calculateMarginPercentage', () => {
    it('should calculate correct margin percentage', () => {
      expect(calculateMarginPercentage(100, 60)).toBe(40);
      expect(calculateMarginPercentage(200, 150)).toBe(25);
      expect(calculateMarginPercentage(75.50, 50.25)).toBe(33.4);
    });

    it('should handle edge cases', () => {
      // Equal prices or higher wholesale price
      expect(calculateMarginPercentage(100, 100)).toBe(0);
      expect(calculateMarginPercentage(100, 120)).toBe(0);

      // Zero or negative prices
      expect(calculateMarginPercentage(0, 50)).toBe(0);
      expect(calculateMarginPercentage(100, 0)).toBe(100);
      expect(calculateMarginPercentage(-100, 50)).toBe(0);

      // NaN inputs
      expect(calculateMarginPercentage(NaN, 50)).toBe(0);
      expect(calculateMarginPercentage(100, NaN)).toBe(0);
    });
  });
}); 