import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

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
    
    // Build query based on user role
    const where = { id: orderId };
    
    // Regular users and retailers can only see their own orders
    if (session.user.role === 'USER' || session.user.role === 'RETAILER') {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { userId: true }
      });
      
      if (!order || order.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Unauthorized to access this order' },
          { status: 403 }
        );
      }
    }
    
    // Get the order with its data
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Since we don't have a dedicated OrderHistory table, we'll create a simulated history
    // based on the order's current status, createdAt, and updatedAt timestamps
    
    // Start with order creation as first history entry
    const orderHistory = [
      {
        id: '1',
        status: 'CREATED',
        timestamp: order.createdAt,
        note: 'Order placed'
      }
    ];
    
    // If the order status has been updated from the default PENDING
    if (order.status !== 'PENDING' || order.updatedAt > order.createdAt) {
      orderHistory.push({
        id: '2',
        status: order.status,
        timestamp: order.updatedAt,
        note: `Order status changed to ${order.status.toLowerCase()}`
      });
    }
    
    // If payment has been processed
    if (order.paymentStatus === 'PAID') {
      // Insert payment confirmation between creation and status update
      orderHistory.splice(1, 0, {
        id: '3',
        status: 'PAYMENT_CONFIRMED',
        timestamp: new Date(order.createdAt.getTime() + 60000), // Assume 1 minute after creation
        note: 'Payment confirmed'
      });
    }
    
    // Add tracking information update if available
    if (order.trackingNumber) {
      orderHistory.push({
        id: '4',
        status: 'TRACKING_ADDED',
        timestamp: order.updatedAt,
        note: 'Tracking information added'
      });
    }
    
    // Sort by timestamp (newest first)
    orderHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return NextResponse.json({ history: orderHistory });
    
  } catch (error) {
    console.error('Error fetching order history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order history' },
      { status: 500 }
    );
  }
}