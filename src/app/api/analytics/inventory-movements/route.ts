import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Fetch 10 most recent inventory movements
    const recentMovements = await prisma.inventoryHistory.findMany({
      select: {
        id: true,
        quantity: true,
        movementType: true,
        performedAt: true,
        reason: true,
        product: {
          select: {
            id: true,
            name: true,
            brand: {
              select: { name: true }
            },
            model: {
              select: { name: true }
            }
          }
        },
        location: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: {
        performedAt: 'desc'
      },
      take: 10
    });

    // Transform data for frontend
    const formattedMovements = recentMovements.map(movement => {
      const productName = movement.product 
        ? `${movement.product.brand.name} ${movement.product.model.name}`
        : 'Unknown Product';
        
      return {
        id: movement.id,
        productName: productName,
        locationName: movement.location.name,
        locationType: movement.location.type,
        movementType: movement.movementType,
        quantity: movement.quantity,
        date: movement.performedAt.toISOString(),
        reason: movement.reason || 'Not specified'
      };
    });

    return NextResponse.json({ 
      inventoryMovements: formattedMovements,
      success: true 
    });
  } catch (error) {
    console.error("Error fetching inventory movements:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory movements", success: false },
      { status: 500 }
    );
  }
}