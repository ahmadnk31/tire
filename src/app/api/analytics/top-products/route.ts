import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Find the top selling products by aggregating OrderItem quantities
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 6 // Limit to top 6 products
    });

    // Get product details for these top sellers
    const productsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            brand: {
              select: {
                name: true
              }
            },
            model: {
              select: {
                name: true
              }
            }
          }
        });

        return {
          id: item.productId,
          name: product ? `${product.brand.name} ${product.model.name}` : 'Unknown Product',
          quantity: item._sum.quantity || 0
        };
      })
    );

    return NextResponse.json({ 
      topProducts: productsWithDetails,
      success: true 
    });
  } catch (error) {
    console.error("Error fetching top products data:", error);
    return NextResponse.json(
      { error: "Failed to fetch top products data", success: false },
      { status: 500 }
    );
  }
}