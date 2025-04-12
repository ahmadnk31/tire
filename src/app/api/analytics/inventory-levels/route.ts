import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Get inventory aggregated by location
    const locations = await prisma.location.findMany({
      where: {
        isActive: true // Only include active locations
      },
      select: {
        id: true,
        name: true,
        type: true
      }
    });
    
    // For each location, get aggregate inventory data
    const inventoryData = await Promise.all(
      locations.map(async (location) => {
        // Get sum of current quantities
        const inventory = await prisma.inventory.aggregate({
          where: {
            locationId: location.id
          },
          _sum: {
            quantity: true,
            minimumLevel: true
          }
        });
        
        return {
          id: location.id,
          name: location.name,
          type: location.type,
          current: inventory._sum.quantity || 0,
          minimum: inventory._sum.minimumLevel || 0
        };
      })
    );

    return NextResponse.json({ 
      inventoryData,
      success: true 
    });
  } catch (error) {
    console.error("Error fetching inventory levels data:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory levels data", success: false },
      { status: 500 }
    );
  }
}