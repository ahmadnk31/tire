import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch popular vehicle models using Prisma's standard API
    const models = await prisma.vehicleModel.findMany({
      select: {
        id: true,
        name: true,
        make: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          }
        },
        trims: {
          select: {
            vehicleYears: {
              select: {
                tireFits: {
                  select: {
                    id: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { make: { name: 'asc' } },
        { name: 'asc' }
      ],
      take: 8,
    });    // Transform the data structure to match what the frontend expects
    // Calculate popularity based on how many tire fits each vehicle model has
    const formattedModels = models.map(model => {
      // Count all tire fitments associated with this vehicle model
      const tireFitCount = model.trims.flatMap(trim => 
        trim.vehicleYears.flatMap(year => year.tireFits)
      ).length;
      
      return {
        id: model.id,
        model: model.name,
        make: model.make.name,
        makeId: model.make.id,
        brandLogo: model.make.logoUrl,
        // Use the tire fitment count instead of product count
        productCount: tireFitCount
      };
    })
    
    // Sort by popularity (number of tire fitments)
    .sort((a, b) => b.productCount - a.productCount);

    return NextResponse.json({ models: formattedModels });
  } catch (error) {
    console.error("Error fetching popular models:", error);
    return NextResponse.json({ error: "Failed to fetch popular models" }, { status: 500 });
  }
}
