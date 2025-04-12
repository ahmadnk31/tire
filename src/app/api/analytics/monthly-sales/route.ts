import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Calculate start date for last 12 months
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(today.getMonth() - 11); // Last 12 months
    startDate.setDate(1); // Start of month
    startDate.setHours(0, 0, 0, 0);
    
    // Get all orders from last 12 months
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      select: {
        id: true,
        total: true,
        createdAt: true,
        paymentStatus: true
      }
    });
    
    // Group orders by month and calculate monthly totals
    const monthlyData: Record<string, { revenue: number, orders: number, month: string }> = {};
    
    // Initialize all months
    for (let i = 0; i < 12; i++) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const key = `${month} ${year}`;
      
      monthlyData[key] = { 
        revenue: 0, 
        orders: 0, 
        month: month 
      };
    }
    
    // Populate with actual data
    for (const order of orders) {
      const date = new Date(order.createdAt);
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const key = `${month} ${year}`;
      
      if (monthlyData[key]) {
        // Only count paid orders for revenue
        if (order.paymentStatus === 'PAID') {
          monthlyData[key].revenue += order.total;
        }
        monthlyData[key].orders += 1;
      }
    }
    
    // Convert to array and sort chronologically
    const monthlySales = Object.entries(monthlyData)
      .map(([key, data]) => ({
        ...data,
        fullMonth: key
      }))
      .sort((a, b) => {
        const [monthA, yearA] = a.fullMonth.split(' ');
        const [monthB, yearB] = b.fullMonth.split(' ');
        
        const dateA = new Date(`${monthA} 1, ${yearA}`);
        const dateB = new Date(`${monthB} 1, ${yearB}`);
        
        return dateA.getTime() - dateB.getTime();
      });

    return NextResponse.json({ 
      monthlySales,
      success: true 
    });
  } catch (error) {
    console.error("Error fetching monthly sales data:", error);
    return NextResponse.json(
      { error: "Failed to fetch monthly sales data", success: false },
      { status: 500 }
    );
  }
}