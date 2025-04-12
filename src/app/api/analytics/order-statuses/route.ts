import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Count all orders
    const totalOrders = await prisma.order.count();
    
    if (totalOrders === 0) {
      return NextResponse.json({ 
        orderStatuses: [],
        success: true 
      });
    }
    
    // Get counts for each order status
    const orderStatusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });
    
    // Define colors for each status
    const statusColors = {
      PENDING: "bg-yellow-500",
      PROCESSING: "bg-blue-500",
      SHIPPED: "bg-green-500",
      DELIVERED: "bg-emerald-500",
      CANCELLED: "bg-red-500"
    };
    
    // Calculate percentages and format data
    const orderStatuses = orderStatusCounts.map(status => {
      const percentage = Math.round((status._count.id / totalOrders) * 100);
      
      return {
        label: status.status,
        value: percentage,
        count: status._count.id,
        color: statusColors[status.status as keyof typeof statusColors] || "bg-gray-500"
      };
    });
    
    // Sort by status order (Processing, Pending, Shipped, Delivered, Cancelled)
    const statusOrder = ["PROCESSING", "PENDING", "SHIPPED", "DELIVERED", "CANCELLED"];
    orderStatuses.sort((a, b) => {
      return statusOrder.indexOf(a.label) - statusOrder.indexOf(b.label);
    });

    return NextResponse.json({ 
      orderStatuses,
      totalOrders,
      success: true 
    });
  } catch (error) {
    console.error("Error fetching order status data:", error);
    return NextResponse.json(
      { error: "Failed to fetch order status data", success: false },
      { status: 500 }
    );
  }
}