import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth/auth-options';
import { OrderStatus, PaymentStatus } from '@prisma/client';

// PATCH /api/user/orders/[id]/notes
// Updates the notes for a specific order (stored in metadata)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const orderId = params.id;
    const { notes } = await request.json();
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to update order notes' }, 
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

    // Validate notes input
    if (typeof notes !== 'string') {
      return NextResponse.json(
        { error: 'Notes must be provided as a string' }, 
        { status: 400 }
      );
    }

    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    // Get the order and check if it belongs to the user
    const order = await prisma.order.findFirst({
      where: { 
        id: orderId,
        userId: user.id
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' }, 
        { status: 404 }
      );
    }

    // Create or update metadata with notes
    const currentMetadata = order.metadata as Record<string, any> || {};
    const updatedMetadata = {
      ...currentMetadata,
      customerNotes: notes
    };

    // Update the order with new metadata
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        metadata: updatedMetadata
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      },
    });

    // Create a formatted delivery address from the order's shipping fields
    const deliveryAddress = [
      updatedOrder.shippingAddressLine1,
      updatedOrder.shippingAddressLine2,
      `${updatedOrder.shippingCity}, ${updatedOrder.shippingState} ${updatedOrder.shippingPostalCode}`,
      updatedOrder.shippingCountry
    ].filter(Boolean).join(', ');

    // Check for product reviews
    const orderItemsWithReviews = await Promise.all(updatedOrder.orderItems.map(async (item) => {
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
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      date: updatedOrder.createdAt.toISOString(),
      total: updatedOrder.total,
      subtotal: updatedOrder.subtotal,
      status: mapOrderStatus(updatedOrder.status),
      trackingNumber: updatedOrder.trackingNumber || null,
      trackingUrl: updatedOrder.trackingUrl || undefined,
      deliveryAddress: deliveryAddress,
      paymentMethod: updatedOrder.paymentMethod,
      paymentStatus: mapPaymentStatus(updatedOrder.paymentStatus),
      metadata: updatedOrder.metadata,
      customerNotes: (updatedOrder.metadata as Record<string, any>)?.customerNotes || '',
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
    console.error(`Error updating notes for order ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update order notes' }, 
      { status: 500 }
    );
  }
}

// Helper function to map OrderStatus enum values to lowercase strings
function mapOrderStatus(status: string) {
  const statusMap: Record<string, string> = {
    'PENDING': 'pending',
    'PROCESSING': 'processing',
    'SHIPPED': 'shipped',
    'DELIVERED': 'delivered',
    'CANCELLED': 'cancelled'
  };
  return statusMap[status] || status.toLowerCase();
}

// Helper function to map PaymentStatus enum values to lowercase strings
function mapPaymentStatus(status: string) {
  const statusMap: Record<string, string> = {
    'PENDING': 'pending',
    'PAID': 'paid',
    'FAILED': 'failed',
    'REFUNDED': 'refunded',
    'PARTIALLY_REFUNDED': 'partially_refunded',
    'CHARGEBACK': 'chargeback',
    'DISPUTED': 'disputed',
    'CANCELLED': 'cancelled'
  };
  return statusMap[status] || status.toLowerCase();
}