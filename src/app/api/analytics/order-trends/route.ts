import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Calculate start date for last 30 days
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 30); // Last 30 days
    startDate.setHours(0, 0, 0, 0);
    
    // Get all orders from last 30 days
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      select: {
        id: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    // Group orders by date
    const ordersByDate: Record<string, {date: string, count: number}> = {};
    
    // Initialize dates for the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const displayDate = new Date(formattedDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      
      ordersByDate[formattedDate] = {
        date: displayDate, 
        count: 0
      };
    }
    
    // Populate with actual order data
    for (const order of orders) {
      const orderDate = order.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (ordersByDate[orderDate]) {
        ordersByDate[orderDate].count += 1;
      }
    }
    
    // Convert to array and sort chronologically
    const orderTrends = Object.values(ordersByDate)
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });

    return NextResponse.json({ 
      orderTrends,
      success: true 
    });
  } catch (error) {
    console.error("Error fetching order trends data:", error);
    return NextResponse.json(
      { error: "Failed to fetch order trends data", success: false },
      { status: 500 }
    );
  }
}