// API route for getting and updating business hours
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Default business hours for initialization
const DEFAULT_BUSINESS_HOURS = [
  { dayOfWeek: 0, isOpen: false, openTime: "09:00", closeTime: "17:00" }, // Sunday - Closed
  { dayOfWeek: 1, isOpen: true, openTime: "09:00", closeTime: "17:00" },  // Monday 
  { dayOfWeek: 2, isOpen: true, openTime: "09:00", closeTime: "17:00" },  // Tuesday
  { dayOfWeek: 3, isOpen: true, openTime: "09:00", closeTime: "17:00" },  // Wednesday
  { dayOfWeek: 4, isOpen: true, openTime: "09:00", closeTime: "17:00" },  // Thursday
  { dayOfWeek: 5, isOpen: true, openTime: "09:00", closeTime: "17:00" },  // Friday
  { dayOfWeek: 6, isOpen: true, openTime: "09:00", closeTime: "17:00" },  // Saturday
];

export async function GET() {
  try {
    // Get all business hours from the database
    let businessHours = await prisma.businessHours.findMany({
      orderBy: { dayOfWeek: 'asc' }
    });
    
    // If no business hours exist yet, initialize with defaults
    if (businessHours.length === 0) {
      // Create default business hours
      await prisma.businessHours.createMany({
        data: DEFAULT_BUSINESS_HOURS
      });
      
      // Fetch the newly created business hours
      businessHours = await prisma.businessHours.findMany({
        orderBy: { dayOfWeek: 'asc' }
      });
    }
    
    return NextResponse.json({ businessHours });
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
    
    // Validate input
    if (!Array.isArray(businessHours) || businessHours.length !== 7) {
      return NextResponse.json(
        { error: "Invalid input, must provide business hours for all 7 days" },
        { status: 400 }
      );
    }
    
    // Update each day's business hours
    for (const hours of businessHours) {
      await prisma.businessHours.upsert({
        where: { dayOfWeek: hours.dayOfWeek },
        update: {
          isOpen: hours.isOpen,
          openTime: hours.openTime,
          closeTime: hours.closeTime
        },
        create: {
          dayOfWeek: hours.dayOfWeek,
          isOpen: hours.isOpen,
          openTime: hours.openTime,
          closeTime: hours.closeTime
        }
      });
    }
    
    // Get the updated business hours
    const updatedBusinessHours = await prisma.businessHours.findMany({
      orderBy: { dayOfWeek: 'asc' }
    });
    
    return NextResponse.json({ businessHours: updatedBusinessHours });
  } catch (error) {
    console.error("Error updating business hours:", error);
    return NextResponse.json(
      { error: "Failed to update business hours" },
      { status: 500 }
    );
  }
}