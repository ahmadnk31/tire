import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const trim = await prisma.vehicleTrim.findUnique({
      where: { id: params.id },
      include: {
        model: {
          include: {
            make: true,
          },
        },
      },
    });
    
    if (!trim) {
      return NextResponse.json(
        { error: "Vehicle trim not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(trim);
  } catch (error) {
    console.error("Error fetching vehicle trim:", error);
    return NextResponse.json(
      { error: "Failed to fetch vehicle trim" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: "Trim name is required" },
        { status: 400 }
      );
    }
    
    // Check if trim exists
    const existingTrim = await prisma.vehicleTrim.findUnique({
      where: { id: params.id },
    });
    
    if (!existingTrim) {
      return NextResponse.json(
        { error: "Vehicle trim not found" },
        { status: 404 }
      );
    }
    
    // Check if another trim with the same name already exists for this model
    if (data.name !== existingTrim.name) {
      const duplicateTrim = await prisma.vehicleTrim.findFirst({
        where: {
          name: data.name,
          modelId: existingTrim.modelId,
          id: { not: params.id },
        },
      });
      
      if (duplicateTrim) {
        return NextResponse.json(
          { error: "A trim with this name already exists for this model" },
          { status: 409 }
        );
      }
    }
    
    // Update the trim
    const updatedTrim = await prisma.vehicleTrim.update({
      where: { id: params.id },
      data: {
        name: data.name,
        description: data.description,
      },
      include: {
        model: {
          include: {
            make: true,
          },
        },
      },
    });
    
    return NextResponse.json(updatedTrim);
  } catch (error) {
    console.error("Error updating vehicle trim:", error);
    return NextResponse.json(
      { error: "Failed to update vehicle trim" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    // Check if trim exists
    const existingTrim = await prisma.vehicleTrim.findUnique({
      where: { id: params.id },
    });
    
    if (!existingTrim) {
      return NextResponse.json(
        { error: "Vehicle trim not found" },
        { status: 404 }
      );
    }
    
    // Check if there are any years associated with this trim
    const trimYears = await prisma.vehicleYear.findMany({
      where: { trimId: params.id },
    });
    
    if (trimYears.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete trim with associated years. Please delete the years first." },
        { status: 400 }
      );
    }
    
    // Delete the trim
    await prisma.vehicleTrim.delete({
      where: { id: params.id },
    });
    
    return NextResponse.json({ message: "Vehicle trim deleted successfully" });
  } catch (error) {
    console.error("Error deleting vehicle trim:", error);
    return NextResponse.json(
      { error: "Failed to delete vehicle trim" },
      { status: 500 }
    );
  }
}