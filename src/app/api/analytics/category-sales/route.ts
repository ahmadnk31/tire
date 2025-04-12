import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // First get all categories
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true
      }
    });
    
    // For each category, calculate the total revenue from orders
    const categorySales = await Promise.all(
      categories.map(async (category) => {
        // Find all products in this category
        const products = await prisma.product.findMany({
          where: {
            categoryId: category.id
          },
          select: {
            id: true
          }
        });
        
        const productIds = products.map(product => product.id);
        
        // Calculate total revenue from order items for these products
        const orderItems = await prisma.orderItem.findMany({
          where: {
            productId: {
              in: productIds
            },
            order: {
              paymentStatus: "PAID" // Only count paid orders
            }
          },
          select: {
            quantity: true,
            price: true
          }
        });
        
        // Calculate revenue
        const revenue = orderItems.reduce((total, item) => {
          return total + (item.price * item.quantity);
        }, 0);
        
        return {
          id: category.id,
          name: category.name,
          revenue: revenue,
          itemsSold: orderItems.reduce((total, item) => total + item.quantity, 0)
        };
      })
    );
    
    // Sort by revenue (highest first)
    const sortedCategorySales = categorySales.sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({ 
      categorySales: sortedCategorySales,
      success: true 
    });
  } catch (error) {
    console.error("Error fetching category sales data:", error);
    return NextResponse.json(
      { error: "Failed to fetch category sales data", success: false },
      { status: 500 }
    );
  }
}