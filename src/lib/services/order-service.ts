/**
 * Order Service
 * 
 * This service handles order creation, discount calculation, and shipping integration.
 * It serves as a central point for business logic related to orders.
 */

import { CartItem, ShippingAddress, ShippingOption } from '@/contexts/cart-context';
import { Promotion } from '@/hooks/use-promotions';
import { calculateTotalDiscount } from '@/contexts/promotion-context';
import { getShippingRates } from '@/lib/shipping/shipping-client';

// Order creation params
interface CreateOrderParams {
  items: CartItem[];
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    userId?: string;
  };
  shippingAddress: ShippingAddress;
  selectedShippingOption: ShippingOption;
  appliedPromotions: Promotion[];
  paymentMethod: string;
  notes?: string;
}

// Order calculation result
interface OrderCalculation {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: {
    amount: number;
    promotions: Promotion[];
    hasFreeShipping: boolean;
  };
  total: number;
}

export class OrderService {
  /**
   * Calculate order totals with discounts and shipping
   */
  static async calculateOrderTotals(params: CreateOrderParams): Promise<OrderCalculation> {
    const { items, shippingAddress, selectedShippingOption, appliedPromotions } = params;
    
    // Calculate subtotal
    const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Calculate discount
    const promotionResult = calculateTotalDiscount(items, appliedPromotions);
    const discountAmount = promotionResult.discountAmount;
    const hasFreeShipping = promotionResult.hasFreeShipping;
    
    // Tax rate (this could be moved to a configuration)
    const taxRate = 0.0825;
    const taxableAmount = subtotal - discountAmount;
    const tax = taxableAmount > 0 ? taxableAmount * taxRate : 0;
    
    // Get shipping cost
    let shipping = selectedShippingOption?.price || 0;
    
    // Apply free shipping if a promotion provides it
    if (hasFreeShipping && shipping > 0) {
      shipping = 0;
    }
    
    // Calculate total
    const total = subtotal - discountAmount + tax + shipping;
    
    return {
      subtotal,
      tax,
      shipping,
      discount: {
        amount: discountAmount,
        promotions: appliedPromotions,
        hasFreeShipping
      },
      total
    };
  }
  
  /**
   * Create an order in the database
   */
  static async createOrder(params: CreateOrderParams): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      // First calculate the order totals
      const calculation = await this.calculateOrderTotals(params);
      
      // Prepare the order data
      const orderData = {
        items: params.items,
        shippingAddress: params.shippingAddress,
        customerInfo: params.customerInfo,
        shippingMethod: params.selectedShippingOption,
        subtotal: calculation.subtotal,
        tax: calculation.tax,
        shippingCost: calculation.shipping,
        discount: calculation.discount,
        total: calculation.total,
        paymentMethod: params.paymentMethod,
        notes: params.notes || ''
      };
      
      // Send to the API to create the order
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }
      
      const result = await response.json();
      
      return {
        success: true,
        orderId: result.id
      };
    } catch (error) {
      console.error('Error creating order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Get available shipping rates for the order
   */
  static async getShippingOptions(items: CartItem[], origin: ShippingAddress, destination: ShippingAddress): Promise<ShippingOption[]> {
    try {
      return await getShippingRates(origin, destination, items);
    } catch (error) {
      console.error('Error getting shipping options:', error);
      // Return default shipping options
      return [
        {
          id: "standard",
          name: "Standard Shipping",
          price: 9.99,
          estimatedDelivery: "3-5 Business Days",
          description: "Standard shipping with tracking"
        },
        {
          id: "express",
          name: "Express Shipping",
          price: 19.99,
          estimatedDelivery: "1-2 Business Days",
          description: "Fast delivery with tracking"
        }
      ];
    }
  }
}