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
    const model = await prisma.vehicleModel.findUnique({
      where: { id: params.id },
      include: {
        make: true,
      },
    });
    
    if (!model) {
      return NextResponse.json(
        { error: "Vehicle model not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(model);
  } catch (error) {
    console.error("Error fetching vehicle model:", error);
    return NextResponse.json(
      { error: "Failed to fetch vehicle model" },
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
    
    // Validate request
    if (!data.name) {
      return NextResponse.json(
        { error: "Model name is required" },
        { status: 400 }
      );
    }
    
    // Check if model exists
    const existingModel = await prisma.vehicleModel.findUnique({
      where: { id: params.id },
    });
    
    if (!existingModel) {
      return NextResponse.json(
        { error: "Vehicle model not found" },
        { status: 404 }
      );
    }
    
    // Check if another model with the same name exists for this make
    if (data.name !== existingModel.name) {
      const duplicateModel = await prisma.vehicleModel.findFirst({
        where: {
          name: data.name,
          makeId: data.makeId || existingModel.makeId,
          id: { not: params.id },
        },
      });
      
      if (duplicateModel) {
        return NextResponse.json(
          { error: "A model with this name already exists for this make" },
          { status: 409 }
        );
      }
    }
    
    // Update the model
    const updatedModel = await prisma.vehicleModel.update({
      where: { id: params.id },
      data: {
        name: data.name,
        makeId: data.makeId || existingModel.makeId,
        description: data.description !== undefined ? data.description : existingModel.description,
      },
      include: {
        make: true,
      },
    });
    
    return NextResponse.json(updatedModel);
  } catch (error) {
    console.error("Error updating vehicle model:", error);
    return NextResponse.json(
      { error: "Failed to update vehicle model" },
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
    // Check if model exists
    const model = await prisma.vehicleModel.findUnique({
      where: { id: params.id },
      include: {
        trims: true,
      },
    });
    
    if (!model) {
      return NextResponse.json(
        { error: "Vehicle model not found" },
        { status: 404 }
      );
    }
    
    // Check if model has associated trims
    if (model.trims.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete model with associated trims. Remove all trims first." },
        { status: 400 }
      );
    }
    
    // Delete the model
    await prisma.vehicleModel.delete({
      where: { id: params.id },
    });
    
    return NextResponse.json({ message: "Vehicle model deleted successfully" });
  } catch (error) {
    console.error("Error deleting vehicle model:", error);
    return NextResponse.json(
      { error: "Failed to delete vehicle model" },
      { status: 500 }
    );
  }
}