import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import { sendEmail } from '@/lib/aws/ses-utils';
import { OrderStatus, PaymentStatus } from '@prisma/client';

interface Params {
  params: {
    id: string;
  };
}

// Order status update schema validation
const orderUpdateSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().url().optional(),
});

// GET a single order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const orderId = params.id;
    
    // Build query - different access levels based on user role
    let where = { id: orderId };
    
    // Regular users and retailers can only see their own orders
    if (session.user.role === 'USER' || session.user.role === 'RETAILER') {
      where = {
        ...where,
        id: session.user.id
      };
    }
    
    const order = await prisma.order.findUnique({
      where,
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                brand: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      order: {
        ...order,
        customer: order.user,
      },
    });
    
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PATCH to update order status, tracking info, etc.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only admin or retailer can update orders
    if (session.user.role !== 'ADMIN' && session.user.role !== 'RETAILER') {
      return NextResponse.json(
        { error: 'Unauthorized to update orders' },
        { status: 403 }
      );
    }
    
    const orderId = params.id;
    const body = await request.json();
    
    // Validate input data
    const { status, trackingNumber, trackingUrl, paymentStatus } = body;
    
    const updateData: any = {};
    
    if (status) {
      // Validate status is a valid enum value
      const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid order status' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }
    
    if (paymentStatus) {
      // Validate payment status is a valid enum value
      const validPaymentStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return NextResponse.json(
          { error: 'Invalid payment status' },
          { status: 400 }
        );
      }
      updateData.paymentStatus = paymentStatus;
    }
    
    if (trackingNumber !== undefined) {
      updateData.trackingNumber = trackingNumber;
    }
    
    if (trackingUrl !== undefined) {
      updateData.trackingUrl = trackingUrl;
    }
    
    // Retailers can only update their own orders
    if (session.user.role === 'RETAILER') {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { userId: true }
      });
      
      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
      
      if (order.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'You can only update your own orders' },
          { status: 403 }
        );
      }
    }
    
    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      order: {
        ...updatedOrder,
        customer: updatedOrder.user
      }
    });
    
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// DELETE an order (admin only)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const id = params.id;
    
    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: true
      }
    });
    
    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Only allow deletion of cancelled orders
    if (existingOrder.status !== 'CANCELLED') {
      return NextResponse.json(
        { error: 'Only cancelled orders can be deleted' },
        { status: 400 }
      );
    }
    
    // Delete the order (Prisma will cascade delete order items)
    await prisma.order.delete({
      where: { id }
    });
    
    return NextResponse.json(
      { message: 'Order deleted successfully' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}

// Helper function to get appropriate message based on order status
function getStatusMessage(status: OrderStatus): string {
  switch (status) {
    case 'PROCESSING':
      return 'We are now processing your order. You will receive another update when it ships.';
    case 'SHIPPED':
      return 'Your order has been shipped! You can track your package using the information below.';
    case 'DELIVERED':
      return 'Your order has been delivered. We hope you enjoy your purchase!';
    case 'CANCELLED':
      return 'Your order has been cancelled. If you did not request this cancellation, please contact customer support.';
    default:
      return 'Thank you for your order. We will keep you updated on its progress.';
  }
}