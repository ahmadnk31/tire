import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/vehicle-years - Get all vehicle years, optionally filtered by model ID and trim ID
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const modelId = url.searchParams.get("modelId");
  const trimId = url.searchParams.get("trimId");

  try {
    let years = [];
    
    if (trimId) {
      // If trimId is provided, get years for that specific trim
      const vehicleYears = await prisma.vehicleYear.findMany({
        where: { trimId },
        orderBy: { year: "desc" },
      });
      years = vehicleYears;
    } else if (modelId) {
      // If only modelId is provided, get years for all trims of that model
      const trims = await prisma.vehicleTrim.findMany({
        where: { modelId },
        include: {
          vehicleYears: {
            orderBy: { year: "desc" },
          },
        },
      });
      
      // Flatten the years from all trims
      years = trims.flatMap(trim => trim.vehicleYears);
      
      // Remove duplicates
      years = Array.from(
        new Map(years.map(year => [year.year, year])).values()
      ).sort((a, b) => b.year - a.year);
    } else {
      // If no filters provided, return all years (unique)
      const allYears = await prisma.vehicleYear.findMany({
        orderBy: { year: "desc" },
      });
      
      // Remove duplicates
      years = Array.from(
        new Map(allYears.map(year => [year.year, year])).values()
      );
    }

    return NextResponse.json(years);
  } catch (error) {
    console.error("Error fetching vehicle years:", error);
    return NextResponse.json(
      { error: "Failed to fetch vehicle years" },
      { status: 500 }
    );
  }
}