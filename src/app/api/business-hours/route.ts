import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Fetch all business hours from the database
    const businessHours = await prisma.businessHours.findMany({
      orderBy: {
        dayOfWeek: 'asc',
      },
    });

    return NextResponse.json(businessHours);
  } catch (error) {
    console.error("Error fetching business hours:", error);
    return NextResponse.json(
      { error: "Failed to fetch business hours" },
      { status: 500 }
    );
  }
}

// Make sure this handler is recognized by Next.js for all valid HTTP methods
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
