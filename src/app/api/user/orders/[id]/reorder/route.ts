import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth/auth-options';

// POST /api/user/orders/[id]/reorder
// Creates a new cart items based on items from a previous order
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const orderId = params.id;
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to reorder items' }, 
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

    // Get the previous order with its items
    const previousOrder = await prisma.order.findFirst({
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

    if (!previousOrder) {
      return NextResponse.json(
        { error: 'Original order not found' }, 
        { status: 404 }
      );
    }

    // Check if products are still available
    for (const item of previousOrder.orderItems) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product || !product.isVisible) {
        return NextResponse.json({
          success: false,
          message: `Product ${item.product.name} is no longer available`
        }, { status: 400 });
      }

      if (product.stock !== null && product.stock < item.quantity) {
        return NextResponse.json({
          success: false,
          message: `Only ${product.stock} units of ${item.product.name} are available`
        }, { status: 400 });
      }
    }

    // Generate a random cart ID
    const cartId = `cart_${Math.random().toString(36).substring(2, 15)}`;

    // Store cart items in session or DB (implementation depends on your cart system)
    // For this example, we'll assume you have a temporary cart storage system
    // In a real application, you would use your actual cart storage mechanism
    
    // Generate a response with the product details to add to cart
    const cartItems = previousOrder.orderItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.product.retailPrice, // Use current price, not historical price
      name: item.product.name,
      imageUrl: item.product.images.length > 0 ? item.product.images[0] : null
    }));
    
    return NextResponse.json({
      success: true,
      message: 'Items are ready for your cart',
      cartId: cartId,
      items: cartItems
    });
  } catch (error) {
    console.error(`Error reordering from order ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to process reorder request' }, 
      { status: 500 }
    );
  }
}