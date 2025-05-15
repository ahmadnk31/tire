import { OrderService } from '../order-service';
import * as PromotionContext from '@/contexts/promotion-context';
import * as ShippingClient from '@/lib/shipping/shipping-client';

// Mock the dependencies
jest.mock('@/contexts/promotion-context', () => ({
  calculateTotalDiscount: jest.fn()
}));

jest.mock('@/lib/shipping/shipping-client', () => ({
  getShippingRates: jest.fn()
}));

// Mock fetch for API calls
global.fetch = jest.fn() as jest.Mock;

describe('OrderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for promotion context
    (PromotionContext.calculateTotalDiscount as jest.Mock).mockReturnValue({
      discountAmount: 10,
      hasFreeShipping: false
    });
    
    // Default mock for shipping rates
    (ShippingClient.getShippingRates as jest.Mock).mockResolvedValue([
      {
        id: 'standard',
        name: 'Standard Shipping',
        price: 9.99,
        estimatedDelivery: '3-5 Business Days'
      }
    ]);
    
    // Default mock for fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'order123' })
    });
  });
  
  describe('calculateOrderTotals', () => {
    it('should calculate order totals correctly', async () => {
      // Arrange
      const params = {
        items: [
          { id: '1', price: 100, quantity: 2, name: 'Product 1', image: '', size: '', brandName: '', productId: '1' },
          { id: '2', price: 50, quantity: 1, name: 'Product 2', image: '', size: '', brandName: '', productId: '2' }
        ],
        customerInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '1234567890'
        },
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '1234567890',
          addressLine1: '123 Main St',
          city: 'Anytown',
          state: 'NY',
          postalCode: '12345',
          country: 'US'
        },
        selectedShippingOption: {
          id: 'standard',
          name: 'Standard Shipping',
          price: 9.99,
          estimatedDelivery: '3-5 Business Days'
        },
        appliedPromotions: [
          { id: '1', code: 'DISCOUNT10', type: 'percentage', value: 10 }
        ],
        paymentMethod: 'stripe'
      };
      
      // Act
      const result = await OrderService.calculateOrderTotals(params);
      
      // Assert
      expect(result.subtotal).toBe(250); // 100*2 + 50*1
      expect(result.shipping).toBe(9.99);
      expect(result.discount.amount).toBe(10); // From mock
      expect(result.total).toBeCloseTo(250 - 10 + 9.99 + 19.8); // subtotal - discount + shipping + tax
    });
    
    it('should apply free shipping when promotion provides it', async () => {
      // Arrange
      (PromotionContext.calculateTotalDiscount as jest.Mock).mockReturnValue({
        discountAmount: 5,
        hasFreeShipping: true
      });
      
      const params = {
        items: [
          { id: '1', price: 100, quantity: 1, name: 'Product 1', image: '', size: '', brandName: '', productId: '1' }
        ],
        customerInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '1234567890'
        },
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '1234567890',
          addressLine1: '123 Main St',
          city: 'Anytown',
          state: 'NY',
          postalCode: '12345',
          country: 'US'
        },
        selectedShippingOption: {
          id: 'standard',
          name: 'Standard Shipping',
          price: 9.99,
          estimatedDelivery: '3-5 Business Days'
        },
        appliedPromotions: [
          { id: '1', code: 'FREESHIPPING', type: 'free_shipping', value: 0 }
        ],
        paymentMethod: 'stripe'
      };
      
      // Act
      const result = await OrderService.calculateOrderTotals(params);
      
      // Assert
      expect(result.shipping).toBe(0);
      expect(result.discount.hasFreeShipping).toBe(true);
    });
  });
  
  describe('createOrder', () => {
    it('should create an order successfully', async () => {
      // Arrange
      const params = {
        items: [
          { id: '1', price: 100, quantity: 1, name: 'Product 1', image: '', size: '', brandName: '', productId: '1' }
        ],
        customerInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '1234567890'
        },
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '1234567890',
          addressLine1: '123 Main St',
          city: 'Anytown',
          state: 'NY',
          postalCode: '12345',
          country: 'US'
        },
        selectedShippingOption: {
          id: 'standard',
          name: 'Standard Shipping',
          price: 9.99,
          estimatedDelivery: '3-5 Business Days'
        },
        appliedPromotions: [],
        paymentMethod: 'stripe'
      };
      
      // Act
      const result = await OrderService.createOrder(params);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.orderId).toBe('order123');
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/orders',
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Object)
        })
      );
    });
    
    it('should handle API errors gracefully', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'API error' })
      });
      
      const params = {
        items: [
          { id: '1', price: 100, quantity: 1, name: 'Product 1', image: '', size: '', brandName: '', productId: '1' }
        ],
        customerInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '1234567890'
        },
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '1234567890',
          addressLine1: '123 Main St',
          city: 'Anytown',
          state: 'NY',
          postalCode: '12345',
          country: 'US'
        },
        selectedShippingOption: {
          id: 'standard',
          name: 'Standard Shipping',
          price: 9.99,
          estimatedDelivery: '3-5 Business Days'
        },
        appliedPromotions: [],
        paymentMethod: 'stripe'
      };
      
      // Act
      const result = await OrderService.createOrder(params);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('API error');
    });
  });
}); 