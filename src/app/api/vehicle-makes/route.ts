import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

// GET /api/vehicle-makes - Get all vehicle makes
export async function GET(req: NextRequest) {
  try {
    const makes = await prisma.vehicleMake.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(makes);
  } catch (error) {
    console.error("Error fetching vehicle makes:", error);
    return NextResponse.json(
      { error: "Failed to fetch vehicle makes" },
      { status: 500 }
    );
  }
}

// POST /api/vehicle-makes - Create a new vehicle make
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated and is an admin
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized. Admin access required." },
      { status: 403 }
    );
  }
  
  try {
    const data = await req.json();
    
    // Validate the request data
    if (!data.name) {
      return NextResponse.json(
        { error: "Vehicle make name is required" },
        { status: 400 }
      );
    }
    
    // Check if make already exists
    const existingMake = await prisma.vehicleMake.findUnique({
      where: { name: data.name },
    });
    
    if (existingMake) {
      return NextResponse.json(
        { error: "Vehicle make already exists" },
        { status: 400 }
      );
    }
    
    // Create new vehicle make
    const newMake = await prisma.vehicleMake.create({
      data: {
        name: data.name,
        logoUrl: data.logoUrl || null,
      },
    });
    
    return NextResponse.json(newMake, { status: 201 });
  } catch (error) {
    console.error("Error creating vehicle make:", error);
    return NextResponse.json(
      { error: "Failed to create vehicle make" },
      { status: 500 }
    );
  }
}