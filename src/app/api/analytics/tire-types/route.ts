import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Query the database to get counts of products by tire type
    const tireTypeCounts = await prisma.product.groupBy({
      by: ['tireType'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    // Transform the data for the frontend
    const tireTypes = tireTypeCounts.map(item => ({
      tireType: item.tireType,
      count: item._count.id
    }));

    return NextResponse.json({ 
      tireTypes,
      success: true 
    });
  } catch (error) {
    console.error("Error fetching tire type analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch tire type data", success: false },
      { status: 500 }
    );
  }
}