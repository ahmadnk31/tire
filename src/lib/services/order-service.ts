import { PrismaClient } from '@prisma/client';
import { ShippingService } from '@/lib/shipping/';

export class OrderService {
  private prisma = new PrismaClient();
  private shippingService = new ShippingService();
  
  async createOrder(data: CreateOrderInput): Promise<Order> {
    // Create shipment using configured shipping provider
    let shippingData = null;
    if (data.shippingMethod) {
      try {
        shippingData = await this.shippingService.createShipment({
          provider: data.shippingMethod.provider,
          serviceLevel: data.shippingMethod.serviceLevel,
          toAddress: data.shippingAddress,
          fromAddress: process.env.WAREHOUSE_ADDRESS 
            ? JSON.parse(process.env.WAREHOUSE_ADDRESS) 
            : this.getDefaultWarehouseAddress(),
          items: data.items.map(item => ({
            id: item.id,
            weight: item.weight || 0,
            dimensions: item.dimensions || { length: 0, width: 0, height: 0 },
            quantity: item.quantity
          }))
        });
      } catch (error) {
        console.error('Error creating shipment:', error);
        // Continue with order creation even if shipment creation fails
        // We'll handle shipping creation separately
      }
    }
    
    // Create order in database
    const order = await this.prisma.order.create({
      data: {
        shippingProvider: data.shippingMethod?.provider,
        trackingNumber: shippingData?.trackingNumber,
        trackingUrl: shippingData?.trackingUrl,
        shippingMethodId: data.shippingMethod?.id,
        shippingMethodName: data.shippingMethod?.name,
        shipping: data.shipping,
        estimatedDeliveryDate: shippingData?.estimatedDelivery,
        // Include shipping metadata if available
        metadata: shippingData ? {
          shippingLabel: shippingData.label,
          shippingId: shippingData.id,
          // ...other metadata from shipping
        } : {},
      },
      include: {
        // ...existing code...
      }
    });
    
    return order;
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