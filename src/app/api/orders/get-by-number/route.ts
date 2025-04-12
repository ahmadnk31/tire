import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderNumber = url.searchParams.get('orderNumber');
  
  if (!orderNumber) {
    return NextResponse.json(
      { error: "Order number is required" },
      { status: 400 }
    );
  }
  
  try {
    // Find the order by order number
    const order = await prisma.order.findFirst({
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
    
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }
    
    // Format order data to match what the frontend expects
    const formattedOrder = {
      ...order,
      items: order.orderItems.map((item: { id: any; product: { name: any; images: any[]; width: any; aspectRatio: any; rimDiameter: any; }; price: any; quantity: any; }) => ({
        id: item.id,
        name: item.product.name,
        price: item.price,
        quantity: item.quantity,
        image: item.product.images[0] || null,
        size: `${item.product.width}/${item.product.aspectRatio}R${item.product.rimDiameter}`
      })),
      shippingAddress: {
        firstName: (order.metadata as any)?.customerInfo?.firstName || "",
        lastName: (order.metadata as any)?.customerInfo?.lastName || "",
        email: (order.metadata as any)?.customerInfo?.email || (order.metadata as any)?.guestEmail || "",
        phone: (order.metadata as any)?.customerInfo?.phone || "",
        addressLine1: order.shippingAddressLine1,
        addressLine2: order.shippingAddressLine2 || "",
        city: order.shippingCity,
        state: order.shippingState,
        postalCode: order.shippingPostalCode,
        country: order.shippingCountry
      },
      shipping: (order.metadata as any)?.shippingMethod || {
        name: "Standard Shipping",
        price: 0,
        estimatedDelivery: "7-10 business days"
      },
      tax: (order.metadata as any)?.tax || 0,
      shippingCost: (order.metadata as any)?.shippingMethod?.price || 0,
      discount: (order.metadata as any)?.discount || 0
    };
    
    return NextResponse.json({
      success: true,
      order: formattedOrder
    });
  } catch (error) {
    console.error("Error retrieving order:", error);
    
    return NextResponse.json(
      { error: "Failed to retrieve order" },
      { status: 500 }
    );
  }
}