import { Order, PrismaClient, OrderStatus, PaymentStatus } from '@prisma/client';
import { ShippingService } from '@/lib/shipping/shipping-service';

// Define the CreateOrderInput interface
interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

interface ShippingMethod {
  id?: string;
  provider: string;
  serviceLevel: string;
  name?: string;
}

interface ShippingAddress {
  contactName?: string;
  firstName?: string;
  lastName?: string;
  addressLine1: string;
  addressLine2?: string;
  street?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  countryCode: string;
  phone: string;
  email?: string;
}

interface CreateOrderInput {
  userId?: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  paymentMethod: string;
  paymentStatus?: PaymentStatus;
  shippingMethod?: ShippingMethod;
  shippingAddress: ShippingAddress;
  billingAddress?: string;
  customerEmail?: string;
  isRetailerOrder?: boolean;
}

export class OrderService {
  private prisma = new PrismaClient();
  private shippingService = new ShippingService();
    async createOrder(data: CreateOrderInput): Promise<Order> {
    // Create shipment using configured shipping provider
    
    let shippingData = null;
    let shippingError = null;
      if (data.shippingMethod) {
      try {
        shippingData = await ShippingService.createShipment({
          provider: data.shippingMethod.provider,
          serviceLevel: data.shippingMethod.serviceLevel,
          toAddress: {
            ...data.shippingAddress,
            contactName: data.shippingAddress.contactName || 
                        `${data.shippingAddress.firstName || ''} ${data.shippingAddress.lastName || ''}`.trim() || 
                        'Customer',
                        email: data.customerEmail || data.shippingAddress.email || '',
          },
          fromAddress: process.env.WAREHOUSE_ADDRESS 
            ? JSON.parse(process.env.WAREHOUSE_ADDRESS) 
            : this.getDefaultWarehouseAddress(),
          items: data.items.map((item: OrderItem) => ({
            id: item.id,
            weight: item.weight || 0,
            dimensions: item.dimensions || { length: 0, width: 0, height: 0 },
            quantity: item.quantity
          }))
        });
      } catch (error) {
        console.error('Error creating shipment:', error);
        shippingError = error instanceof Error ? error.message : 'Unknown shipping error';
        // Proceed with order creation even with shipping failure
        // We'll mark the order for manual shipping processing
      }
    }      // Create order in database with order number
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    const order = await this.prisma.order.create({
      data: {
        orderNumber, // Required field
        userId: data.userId,
        status: 'PENDING', // Default to pending status
        paymentStatus: data.paymentStatus || 'PENDING', // Using enum values from schema
        paymentMethod: data.paymentMethod,
        subtotal: data.subtotal,
        total: data.total,
        isRetailerOrder: data.isRetailerOrder || false,        // Shipping details - handle gracefully if shipping creation failed
        carrier: data.shippingMethod?.provider || 'DHL', // Default carrier
        trackingNumber: shippingData?.trackingNumber || null,
        trackingUrl: shippingData?.trackingNumber 
          ? this.generateTrackingUrl(data.shippingMethod?.provider || 'DHL', shippingData.trackingNumber)
          : null,
        
        // Include shipping metadata if available
        metadata: {
          ...(shippingData ? {
            shippingLabel: shippingData.labelUrl,
            shippingId: shippingData.shipmentId,
            estimatedDeliveryDate: shippingData?.estimatedDeliveryDate || null,
            shippingMethodId: data.shippingMethod?.id,
            shippingMethodName: data.shippingMethod?.name,
          } : {}),
          ...(shippingError ? {
            shippingError: shippingError,
            requiresManualShipping: true,
            shippingFailedAt: new Date().toISOString()
          } : {})
        },
        
        // Address information mapped to the schema fields
        shippingAddressLine1: data.shippingAddress.addressLine1 || data.shippingAddress.street || '',
        shippingAddressLine2: data.shippingAddress.addressLine2 || '',
        shippingCity: data.shippingAddress.city || '',
        shippingState: data.shippingAddress.state || '',
        shippingPostalCode: data.shippingAddress.postalCode || '',
        shippingCountry: data.shippingAddress.country || data.shippingAddress.countryCode || '',
        billingAddress: data.billingAddress || data.shippingAddress.addressLine1 || '', // Use shipping as fallback          // Order items
        orderItems: {
          create: data.items.map((item: OrderItem) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
            isWholesalePrice: data.isRetailerOrder || false
          }))
        },
        
        // Create initial order history entry
        orderHistory: {
          create: {
            status: 'PENDING',
            note: 'Order created',
            userId: data.userId
          }
        }
      },
      include: {
        orderItems: true,
        orderHistory: true
      }
    });
    
    return order;
  }
  
  /**
   * Generate a tracking URL based on the carrier and tracking number
   * @param carrier The shipping carrier (DHL, FedEx, etc.)
   * @param trackingNumber The tracking number for the shipment
   * @returns URL where the customer can track their shipment
   */
  private generateTrackingUrl(carrier: string, trackingNumber: string): string {
    // Normalize carrier name to handle case variations
    const normalizedCarrier = carrier.toLowerCase().trim();
    
    switch (normalizedCarrier) {
      case 'dhl':
        return `https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id=${trackingNumber}`;
      
      case 'fedex':
        return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
      
      case 'ups':
        return `https://www.ups.com/track?tracknum=${trackingNumber}`;
      
      case 'usps':
        return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
      
      case 'gls':
        return `https://gls-group.com/track/${trackingNumber}`;
      
      // Add more carriers as needed
      
      default:
        // If carrier is unknown, use a generic format or your own tracking page
        return `/tracking?carrier=${encodeURIComponent(carrier)}&number=${trackingNumber}`;
    }
  }
  
  // Helper method to get default warehouse address if not configured in env
  private getDefaultWarehouseAddress() {
    return {
      street: '123 Warehouse St',
      city: 'Warehouse City',
      state: 'WS',
      postalCode: '12345',
      country: 'US',
      company: 'Your Company Name'
    };
  }
}