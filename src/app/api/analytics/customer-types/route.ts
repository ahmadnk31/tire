import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Count total orders
    const totalOrders = await prisma.order.count({
      where: {
        paymentStatus: "PAID"
      }
    });
    
    // Count retailer orders
    const retailerOrders = await prisma.order.count({
      where: {
        paymentStatus: "PAID",
        isRetailerOrder: true
      }
    });
    
    // Count consumer orders
    const consumerOrders = await prisma.order.count({
      where: {
        paymentStatus: "PAID",
        isRetailerOrder: false
      }
    });
    
    // Calculate percentages
    const retailerPercentage = totalOrders > 0 
      ? Math.round((retailerOrders / totalOrders) * 100) 
      : 0;
    
    const consumerPercentage = totalOrders > 0 
      ? Math.round((consumerOrders / totalOrders) * 100) 
      : 0;

    // Calculate revenue distribution
    const retailerRevenue = await prisma.order.aggregate({
      where: {
        paymentStatus: "PAID",
        isRetailerOrder: true
      },
      _sum: {
        total: true
      }
    });

    const consumerRevenue = await prisma.order.aggregate({
      where: {
        paymentStatus: "PAID", 
        isRetailerOrder: false
      },
      _sum: {
        total: true
      }
    });

    const totalRevenue = (retailerRevenue._sum.total || 0) + (consumerRevenue._sum.total || 0);
    
    const retailerRevenuePercentage = totalRevenue > 0 
      ? Math.round(((retailerRevenue._sum.total || 0) / totalRevenue) * 100) 
      : 0;
    
    const consumerRevenuePercentage = totalRevenue > 0 
      ? Math.round(((consumerRevenue._sum.total || 0) / totalRevenue) * 100) 
      : 0;
    
    return NextResponse.json({ 
      customerTypes: [
        { 
          type: "Retailers", 
          orderPercentage: retailerPercentage,
          revenuePercentage: retailerRevenuePercentage,
          orderCount: retailerOrders,
          revenue: retailerRevenue._sum.total || 0
        },
        { 
          type: "Consumers", 
          orderPercentage: consumerPercentage,
          revenuePercentage: consumerRevenuePercentage,
          orderCount: consumerOrders,
          revenue: consumerRevenue._sum.total || 0
        }
      ],
      success: true 
    });
  } catch (error) {
    console.error("Error fetching customer type data:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer type data", success: false },
      { status: 500 }
    );
  }
}