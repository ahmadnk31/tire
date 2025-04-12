import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Fetch 10 most recent orders with user information
    const recentOrders = await prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        total: true,
        createdAt: true,
        status: true,
        paymentStatus: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Limit to 10 recent orders
    });

    // Transform data for the frontend
    const formattedOrders = recentOrders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.user.name,
      customerEmail: order.user.email,
      date: order.createdAt.toISOString(),
      status: order.status,
      total: order.total,
      paymentStatus: order.paymentStatus
    }));

    return NextResponse.json({ 
      recentOrders: formattedOrders,
      success: true 
    });
  } catch (error) {
    console.error("Error fetching recent order details:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent order details", success: false },
      { status: 500 }
    );
  }
}