import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';

// Order status update schema validation
const orderStatusUpdateSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  trackingNumber: z.string().optional(),
  shippingProvider: z.string().optional(),
  trackingUrl: z.string().optional(),
});

// PUT endpoint to update the status of an order
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized. Only admin and staff can update order status.' },
        { status: 401 }
      );
    }
    
    const orderId = params.id;
    const data = await request.json();
    
    // Validate request data
    const validationResult = orderStatusUpdateSchema.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { status, trackingNumber, shippingProvider, trackingUrl } = validationResult.data;

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        trackingNumber,
        carrier: shippingProvider,
        trackingUrl,
        updatedAt: new Date()
      },
    });
    
    // Create history entry for this status update
    await prisma.orderHistory.create({
      data: {
        orderId,
        status,
        note: `Order status updated to ${status}${trackingNumber ? ` with tracking number ${trackingNumber}` : ''}`,
        userId: session.user.id,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder
    });
    
  } catch (error) {
    console.error('Error updating order status:', error);
    
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
