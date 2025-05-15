import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const paymentIntentId = url.searchParams.get('paymentIntentId');
  const orderNumber = url.searchParams.get('orderNumber');
  
  // Check if we have either a payment intent ID or order number
  if (!paymentIntentId && !orderNumber) {
    return NextResponse.json(
      { error: "Either payment intent ID or order number is required" },
      { status: 400 }
    );
  }
  
  try {
    let order;
    
    if (paymentIntentId) {
      // Find the order by payment intent ID stored in metadata
      order = await prisma.order.findFirst({
        where: {
          OR: [
            {
              // For Stripe payment intents that start with "pi_"
              metadata: {
                path: ["paymentId"],
                equals: paymentIntentId
              }
            },
            {
              // For PayPal payments that start with "pp_"
              metadata: {
                path: ["paymentId"],
                equals: paymentIntentId
              }
            },
            {
              // For manual/fallback payment IDs
              metadata: {
                path: ["paymentId"],
                equals: paymentIntentId
              }
            }
          ]
        },
        include: {
          orderItems: {
            include: {
              product: true
            }
          }
        }
      });
    } else if (orderNumber) {
      // Find the order by order number (alternative lookup method)
      order = await prisma.order.findUnique({
        where: {
          orderNumber: orderNumber
        },
        include: {
          orderItems: {
            include: {
              product: true
            }
          }
        }
      });
    }
    
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }
    
    // Only update to PROCESSING if it's not already processed
    const updatedOrder = order.status === "PENDING" ? 
      await prisma.order.update({
        where: {
          id: order.id
        },
        data: {
          status: "PROCESSING",
          paymentStatus: "PAID"
        },
        include: {
          orderItems: {
            include: {
              product: true
            }
          }
        }
      }) : order;
    
    // Format discount information properly
    const discountInfo = (updatedOrder.metadata as any)?.discount || {
      amount: 0,
      promotions: []
    };
    
    // Check if discount is just a number (old format) and convert to object
    const normalizedDiscount = typeof discountInfo === 'number' ? {
      amount: discountInfo,
      promotions: []
    } : discountInfo;
    
    // Format order data to match what the frontend expects
    const formattedOrder = {
      ...updatedOrder,
      items: updatedOrder.orderItems.map(item => ({
        id: item.id,
        name: item.product.name,
        price: item.price,
        quantity: item.quantity,
        image: item.product.images[0] || null,
        size: `${item.product.width}/${item.product.aspectRatio}R${item.product.rimDiameter}`
      })),
      shippingAddress: {
        firstName: (updatedOrder.metadata as any)?.customerInfo?.firstName || "",
        lastName: (updatedOrder.metadata as any)?.customerInfo?.lastName || "",
        email: (updatedOrder.metadata as any)?.customerInfo?.email || (updatedOrder.metadata as any)?.guestEmail || "",
        phone: (updatedOrder.metadata as any)?.customerInfo?.phone || "",
        addressLine1: updatedOrder.shippingAddressLine1,
        addressLine2: updatedOrder.shippingAddressLine2 || "",
        city: updatedOrder.shippingCity,
        state: updatedOrder.shippingState,
        postalCode: updatedOrder.shippingPostalCode,
        country: updatedOrder.shippingCountry
      },
      shipping: (updatedOrder.metadata as any)?.shippingMethod || {
        name: "Standard Shipping",
        price: 0,
        estimatedDelivery: "7-10 business days"
      },
      tax: (updatedOrder.metadata as any)?.tax || 0,
      shippingCost: (updatedOrder.metadata as any)?.shippingMethod?.price || 0,
      discount: normalizedDiscount
    };
    
    return NextResponse.json({
      success: true,
      order: formattedOrder
    });
  } catch (error) {
    console.error("Error verifying order:", error);
    
    return NextResponse.json(
      { error: "Failed to verify order" },
      { status: 500 }
    );
  }
}