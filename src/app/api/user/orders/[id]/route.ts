import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth/auth-options';


// GET /api/user/orders/[id]
// Retrieves a specific order for the authenticated user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const orderId = params.id;
    
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

    // Get the specific order for this user
    const order = await prisma.order.findFirst({
      where: { 
        id: orderId,
        userId: user.id // Ensure the order belongs to the authenticated user
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      },
    });

    // If order not found or doesn't belong to user
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' }, 
        { status: 404 }
      );
    }

    // Create a formatted delivery address from the order's shipping fields
    const deliveryAddress = [
      order.shippingAddressLine1,
      order.shippingAddressLine2,
      `${order.shippingCity}, ${order.shippingState} ${order.shippingPostalCode}`,
      order.shippingCountry
    ].filter(Boolean).join(', ');

    // Check for product reviews
    const orderItemsWithReviews = await Promise.all(order.orderItems.map(async (item) => {
      const review = await prisma.review.findFirst({
        where: {
          userId: user.id,
          productId: item.productId
        }
      });
      
      return {
        ...item,
        review
      };
    }));

    // Transform the order data to match our Order interface
    const transformedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      date: order.createdAt.toISOString(),
      total: order.total,
      subtotal: order.subtotal,
      status: mapOrderStatus(order.status),
      trackingNumber: order.trackingNumber || null,
      trackingUrl: order.trackingUrl || undefined,
      deliveryAddress: deliveryAddress,
      paymentMethod: order.paymentMethod,
      paymentStatus: mapPaymentStatus(order.paymentStatus),
      metadata: order.metadata || undefined,
      items: orderItemsWithReviews.map((item) => ({
        id: item.id,
        name: item.product.name,
        price: item.price,
        quantity: item.quantity,
        productId: item.productId,
        imageUrl: item.product.images.length > 0 ? item.product.images[0] : undefined,
        rating: item.review?.rating,
        reviewId: item.review?.id
      })),
    };

    return NextResponse.json(transformedOrder);
  } catch (error) {
    console.error(`Error fetching order ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch order details' }, 
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