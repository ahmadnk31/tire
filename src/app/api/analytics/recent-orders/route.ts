import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Fetch 5 most recent orders with user information
    const recentOrders = await prisma.order.findMany({
      where: {
        paymentStatus: "PAID" // Only show paid orders
      },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        createdAt: true,
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
      take: 5 // Limit to 5 recent orders
    });

    // Transform data for the frontend
    const formattedOrders = recentOrders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.user.name,
      email: order.user.email,
      total: order.total,
      date: order.createdAt.toISOString()
    }));

    return NextResponse.json({ 
      recentOrders: formattedOrders,
      success: true 
    });
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent orders", success: false },
      { status: 500 }
    );
  }
}