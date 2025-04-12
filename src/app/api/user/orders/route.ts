import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth/auth-options';


// GET /api/user/orders
// Retrieves all orders for the authenticated user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access your orders' }, 
        { status: 401 }
      );
    }

    // Get user's email from session
    const userEmail = session.user.email;
    
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found in session' }, 
        { status: 400 }
      );
    }

    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    // Get all orders for this user
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      },
    });

    // Transform the orders data to match our Order interface
    const transformedOrders = orders.map((order) => {
      // Create a formatted delivery address from the order's shipping fields
      const deliveryAddress = [
        order.shippingAddressLine1,
        order.shippingAddressLine2,
        `${order.shippingCity}, ${order.shippingState} ${order.shippingPostalCode}`,
        order.shippingCountry
      ].filter(Boolean).join(', ');

      // Map order status from uppercase enum to lowercase string
      const status = mapOrderStatus(order.status);

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        date: order.createdAt.toISOString(),
        total: order.total,
        subtotal: order.subtotal,
        status: status,
        trackingNumber: order.trackingNumber || null,
        trackingUrl: order.trackingUrl || undefined,
        deliveryAddress: deliveryAddress,
        paymentMethod: order.paymentMethod,
        paymentStatus: mapPaymentStatus(order.paymentStatus),
        metadata: order.metadata || undefined,
        items: order.orderItems.map((item) => ({
          id: item.id,
          name: item.product.name,
          price: item.price,
          quantity: item.quantity,
          productId: item.productId,
          imageUrl: item.product.images.length > 0 ? item.product.images[0] : undefined,
        })),
      };
    });

    return NextResponse.json(transformedOrders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' }, 
      { status: 500 }
    );
  }
}

// Helper function to map OrderStatus enum values to lowercase strings
function mapOrderStatus(status: string) {
  const statusMap = {
    'PENDING': 'pending',
    'PROCESSING': 'processing',
    'SHIPPED': 'shipped',
    'DELIVERED': 'delivered',
    'CANCELLED': 'cancelled'
  };
  return statusMap[status as keyof typeof statusMap] || status.toLowerCase();
}

// Helper function to map PaymentStatus enum values to lowercase strings
function mapPaymentStatus(status: string) {
  const statusMap = {
    'PENDING': 'pending',
    'PAID': 'paid',
    'FAILED': 'failed',
    'REFUNDED': 'refunded',
    'PARTIALLY_REFUNDED': 'partially_refunded',
    'CHARGEBACK': 'chargeback',
    'DISPUTED': 'disputed',
    'CANCELLED': 'cancelled'
  };
  return statusMap[status as keyof typeof statusMap] || status.toLowerCase();
}