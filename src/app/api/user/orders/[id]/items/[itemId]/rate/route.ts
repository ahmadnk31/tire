import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth/auth-options';


// POST /api/user/orders/[id]/items/[itemId]/rate
// Submits a rating and optional review for an order item
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const orderId = params.id;
    const itemId = params.itemId;
    const { rating, review } = await request.json();
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to rate products' }, 
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

    // Validate rating input
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be a number between 1 and 5' }, 
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

    // Check if the order is delivered (only allow rating for delivered orders)
    if (order.status !== 'DELIVERED') {
      return NextResponse.json(
        { error: 'Can only rate items from delivered orders' }, 
        { status: 400 }
      );
    }

    // Check if the order item exists
    const orderItem = await prisma.orderItem.findUnique({
      where: {
        id: itemId
      }
    });

    if (!orderItem || orderItem.orderId !== orderId) {
      return NextResponse.json(
        { error: 'Order item not found' }, 
        { status: 404 }
      );
    }

    // Check if a review already exists
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: user.id,
        productId: orderItem.productId
      }
    });

    if (existingReview) {
      // Update the existing review
      const updatedReview = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating,
          title: review ? review.substring(0, 100) : existingReview.title, // Use first 100 chars as title if provided
          content: review || existingReview.content,
          verified: true // Mark as verified since it's from an order
        }
      });

      // Update helpful count if it reset
      if (existingReview.helpfulCount > 0 && !updatedReview.helpfulCount) {
        await prisma.review.update({
          where: { id: updatedReview.id },
          data: { helpfulCount: existingReview.helpfulCount }
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Product rating updated successfully',
        reviewId: updatedReview.id
      });
    } else {
      // Create a new review
      const newReview = await prisma.review.create({
        data: {
          userId: user.id,
          productId: orderItem.productId,
          rating,
          title: review ? review.substring(0, 100) : 'Product Review', // Use first 100 chars as title if provided
          content: review || 'Great product!',
          verified: true, // Mark as verified since it's from an order
          status: 'PUBLISHED'
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Product rated successfully',
        reviewId: newReview.id
      });
    }
  } catch (error) {
    console.error(`Error rating item ${params.itemId} for order ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to submit product rating' }, 
      { status: 500 }
    );
  }
}