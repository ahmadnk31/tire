import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const now = new Date();
    
    const promotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: {
          lte: now
        },
        OR: [
          { endDate: null },
          { endDate: { gte: now } }
        ]
      },
      include: {
        products: { select: { id: true, name: true } },
        brands: { select: { id: true, name: true } },
        categories: { select: { id: true, name: true } },
        subscriberGroups: { select: { id: true, name: true } },
        models: { select: { id: true, name: true } },
      },
      orderBy: {
        endDate: 'asc'
      }
    });
    
    // Return in the format expected by the useActivePromotions hook
    return NextResponse.json({ promotions });
  } catch (error) {
    console.error("Error fetching active promotions:", error);
    return NextResponse.json(
      { error: "Failed to fetch active promotions" },
      { status: 500 }
    );
  }
}
