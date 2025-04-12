import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db";
import { sendOrderCancellationEmail } from "@/lib/aws/ses-utils";

/**
 * POST /api/user/orders/[id]/cancel
 * 
 * Cancel an order if it's in a cancellable state
 * 
 * @param request - The request object
 * @param params - The params object containing the order ID
 * @returns A JSON response with the result of the cancellation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the order to cancel
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            notificationPreferences: true
          }
        }
      }
    });

    // Verify order exists and belongs to the user
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Verify ownership unless the user is an admin
    if (order.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You are not authorized to cancel this order" },
        { status: 403 }
      );
    }

    // Check if order is in a cancellable state
    if (order.status !== "PROCESSING" && order.status !== "PENDING") {
      return NextResponse.json(
        { error: `Order cannot be cancelled. Current status: ${order.status}` },
        { status: 400 }
      );
    }

    // Optional: Get cancellation reason from request body
    const requestData = await request.json().catch(() => ({}));
    const cancellationReason = requestData.reason || "Cancelled by customer";

    // Start a transaction to ensure all operations succeed or fail together
    const updatedOrder = await prisma.$transaction(async (prismaClient) => {
      // 1. Update the order status to CANCELLED
      const updatedOrder = await prismaClient.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
          paymentStatus: "CANCELLED",
          updatedAt: new Date(),
          // Store cancellation details in metadata
          metadata: {
            ...order.metadata as object || {},
            cancellation: {
              cancelledAt: new Date().toISOString(),
              cancelledBy: session.user.id,
              reason: cancellationReason
            }
          }
        }
      });

      // 2. Return inventory to stock if needed
      // This would depend on your inventory management flow
      // For example, if inventory was already decremented for this order:
      const orderItems = await prismaClient.orderItem.findMany({
        where: { orderId },
        include: {
          product: true
        }
      });

      // Create inventory movement records if needed
      for (const item of orderItems) {
        // Find the first inventory record for this product (simplification)
        const inventory = await prismaClient.inventory.findFirst({
          where: { productId: item.productId }
        });

        if (inventory) {
          // Update inventory quantity
          await prismaClient.inventory.update({
            where: { id: inventory.id },
            data: { quantity: { increment: item.quantity } }
          });

          // Record inventory movement
          await prismaClient.inventoryMovement.create({
            data: {
              inventoryId: inventory.id,
              locationId: inventory.locationId,
              orderId: orderId,
              quantity: item.quantity, // Positive number for returned inventory
              movementType: "RETURN",
              reason: "Order cancelled",
              referenceNumber: order.orderNumber,
              notes: `Order #${order.orderNumber} cancelled: ${cancellationReason}`,
              createdBy: session.user.id
            }
          });
        }
      }

      return updatedOrder;
    });

    // Send email notification if user has order updates enabled
    const shouldSendEmail = order.user?.notificationPreferences?.orderUpdates !== false;
    
    if (shouldSendEmail && order.user && order.user.email) {
      try {
        await sendOrderCancellationEmail(
          order.user.email,
          order.user.name || "Valued Customer",
          order.orderNumber,
          cancellationReason,
          new Date()
        );
      } catch (emailError) {
        console.error("Failed to send cancellation email:", emailError);
        // Continue execution even if email fails
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully",
      orderNumber: order.orderNumber
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return NextResponse.json(
      { error: "Failed to cancel order", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}