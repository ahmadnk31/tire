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

    return NextResponse.json( businessHours );
  } catch (error) {
    console.error("Error fetching business hours:", error);
    return NextResponse.json(
      { error: "Failed to fetch business hours" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { businessHours } = await request.json();
    
    if (!businessHours || !Array.isArray(businessHours)) {
      return NextResponse.json(
        { error: "Invalid request data. Expected array of business hours." },
        { status: 400 }
      );
    }

    // First, fetch existing records to determine which ones to update/create
    const existingHours = await prisma.businessHours.findMany();
    const existingHoursMap = new Map(
      existingHours.map(hour => [hour.dayOfWeek, hour])
    );
    
    // Process each business hour
    const results = await Promise.all(
      businessHours.map(async (hour) => {
        const { dayOfWeek, isOpen, openTime, closeTime } = hour;
        const existing = existingHoursMap.get(dayOfWeek);
        
        // Update or create the business hour
        if (existing) {
          return prisma.businessHours.update({
            where: { id: existing.id },
            data: { isOpen, openTime, closeTime },
          });
        } else {
          return prisma.businessHours.create({
            data: { dayOfWeek, isOpen, openTime, closeTime },
          });
        }
      })
    );
    
    return NextResponse.json({ 
      success: true, 
      message: "Business hours updated successfully",
      businessHours: results 
    });
  } catch (error) {
    console.error("Error updating business hours:", error);
    return NextResponse.json(
      { error: "Failed to update business hours" },
      { status: 500 }
    );
  }
}

// Make sure this handler is recognized by Next.js for all valid HTTP methods
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
