import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TireType, SpeedRating } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // Get brands
    const brands = await prisma.brand.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Get categories
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Get unique widths, aspect ratios, and rim diameters
    const widthsResult = await prisma.product.groupBy({
      by: ['width'],
      orderBy: {
        width: 'asc'
      }
    });
    
    const aspectRatiosResult = await prisma.product.groupBy({
      by: ['aspectRatio'],
      orderBy: {
        aspectRatio: 'asc'
      }
    });
    
    const rimDiametersResult = await prisma.product.groupBy({
      by: ['rimDiameter'],
      orderBy: {
        rimDiameter: 'asc'
      }
    });

    // Extract the values from the results
    const widths = widthsResult.map(item => item.width);
    const aspectRatios = aspectRatiosResult.map(item => item.aspectRatio);
    const rimDiameters = rimDiametersResult.map(item => item.rimDiameter);

    // Get tire types from enum
    const tireTypes = Object.values(TireType);
    
    // Get speed ratings from enum
    const speedRatings = Object.values(SpeedRating);

    // Return all filter options
    return NextResponse.json({
      brands,
      categories,
      widths,
      aspectRatios,
      rimDiameters,
      tireTypes,
      speedRatings
    });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return NextResponse.json(
      { error: "Failed to fetch filter options" },
      { status: 500 }
    );
  }
}