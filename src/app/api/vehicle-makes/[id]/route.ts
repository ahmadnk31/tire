import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

// GET /api/vehicle-makes/[id] - Get a specific vehicle make
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const make = await prisma.vehicleMake.findUnique({
      where: { id },
      include: {
        models: true, // Include vehicle models
      },
    });

    if (!make) {
      return NextResponse.json(
        { error: "Vehicle make not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(make);
  } catch (error) {
    console.error(`Error fetching vehicle make with ID ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch vehicle make" },
      { status: 500 }
    );
  }
}

// PATCH /api/vehicle-makes/[id] - Update a vehicle make
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
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
    
    // Check if make exists
    const existingMake = await prisma.vehicleMake.findUnique({
      where: { id },
    });
    
    if (!existingMake) {
      return NextResponse.json(
        { error: "Vehicle make not found" },
        { status: 404 }
      );
    }
    
    // Update vehicle make
    const updatedMake = await prisma.vehicleMake.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        logoUrl: data.logoUrl !== undefined ? data.logoUrl : undefined,
      },
    });
    
    return NextResponse.json(updatedMake);
  } catch (error) {
    console.error(`Error updating vehicle make with ID ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to update vehicle make" },
      { status: 500 }
    );
  }
}

// DELETE /api/vehicle-makes/[id] - Delete a vehicle make
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated and is an admin
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized. Admin access required." },
      { status: 403 }
    );
  }
  
  try {
    // Check if make exists
    const existingMake = await prisma.vehicleMake.findUnique({
      where: { id },
      include: {
        models: true,
      },
    });
    
    if (!existingMake) {
      return NextResponse.json(
        { error: "Vehicle make not found" },
        { status: 404 }
      );
    }
    
    // Check if make has models associated with it
    if (existingMake.models.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete vehicle make with associated models" },
        { status: 400 }
      );
    }
    
    // Delete vehicle make
    await prisma.vehicleMake.delete({
      where: { id },
    });
    
    return NextResponse.json(
      { message: "Vehicle make deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting vehicle make with ID ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to delete vehicle make" },
      { status: 500 }
    );
  }
}