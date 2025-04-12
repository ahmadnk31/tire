import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth/auth-options';
import { $Enums } from '@prisma/client';
import { JsonValue } from '@prisma/client/runtime/library';

// GET /api/user/orders/[id]/history
// Retrieves the history of status changes for a specific order
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
        { error: 'You must be signed in to view order history' }, 
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
      where: { email: userEmail }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    // Check if the order exists and belongs to the user
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

    // Since we don't have a dedicated order history table,
    // we'll generate a history based on the order's metadata and status
    
    // Check if there's history stored in metadata
    const orderMetadata = order.metadata as Record<string, any> || {};
    let historyEntries = orderMetadata.statusHistory || [];
    
    // If no history in metadata, generate a basic history from current status
    if (historyEntries.length === 0) {
      // Generate a minimal history based on the current status
      historyEntries = generateBasicHistory(order);
    }
    
    // Sort history by date (newest first)
    historyEntries.sort((a: { date: string | number | Date; }, b: { date: string | number | Date; }) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return NextResponse.json(historyEntries);
  } catch (error) {
    console.error(`Error fetching history for order ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch order history' }, 
      { status: 500 }
    );
  }
}

// Helper function to generate basic history entries based on order status
function generateBasicHistory(order: { status: $Enums.OrderStatus; id: string; createdAt: Date; updatedAt: Date; userId: string; orderNumber: string; total: number; subtotal: number; isRetailerOrder: boolean; trackingNumber: string | null; trackingUrl: string | null; metadata: JsonValue | null; shippingAddressLine1: string; shippingAddressLine2: string | null; shippingCity: string; shippingState: string; shippingPostalCode: string; shippingCountry: string; billingAddress: string; paymentMethod: string; paymentStatus: $Enums.PaymentStatus; }) {
  const history = [];
  const currentStatus = order.status;
  
  // Add entry for current status
  history.push({
    date: order.updatedAt.toISOString(),
    status: mapOrderStatus(currentStatus),
    note: `Order ${mapOrderStatus(currentStatus).toLowerCase()}`
  });
  
  // Add order creation entry
  history.push({
    date: order.createdAt.toISOString(),
    status: "pending",
    note: "Order created"
  });
  
  // If the order is past pending, add intermediate statuses based on logical progression
  if (currentStatus === 'PROCESSING' || currentStatus === 'SHIPPED' || currentStatus === 'DELIVERED') {
    // Insert a processing status entry if the current status is beyond that
    if (currentStatus !== 'PROCESSING') {
      const processingDate = new Date(order.createdAt);
      processingDate.setHours(processingDate.getHours() + 2); // Estimate 2 hours after creation
      
      history.push({
        date: processingDate.toISOString(),
        status: "processing",
        note: "Order processing started"
      });
    }
    
    // Insert a shipped status entry if the current status is beyond that
    if (currentStatus === 'SHIPPED' || currentStatus === 'DELIVERED') {
      const shippedDate = new Date(order.updatedAt);
      if (currentStatus === 'DELIVERED') {
        // If delivered, set shipped date to a reasonable time before delivery
        shippedDate.setDate(shippedDate.getDate() - 3);
      }
      
      history.push({
        date: shippedDate.toISOString(),
        status: "shipped",
        note: order.trackingNumber 
          ? `Order shipped. Tracking number: ${order.trackingNumber}`
          : "Order shipped"
      });
    }
  } else if (currentStatus === 'CANCELLED') {
    // If cancelled, just add the cancellation entry
    history.push({
      date: order.updatedAt.toISOString(),
      status: "cancelled",
      note: "Order was cancelled"
    });
  }
  
  // Sort by date (oldest first for the generation, we'll reverse later)
  return history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
  return status in statusMap ? statusMap[status as keyof typeof statusMap] : status.toLowerCase();
}