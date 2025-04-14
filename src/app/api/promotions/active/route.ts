import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const promotions = await prisma.promotion.findMany({
      where: { isActive: true }
    });
    return NextResponse.json(promotions);
  } catch (error) {
    console.error("Error fetching active promotions:", error);
    return NextResponse.json(
      { error: "Failed to fetch active promotions" },
      { status: 500 }
    );
  }
}
