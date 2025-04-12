import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const makeId = searchParams.get("makeId");
    
    const whereClause = makeId ? { makeId } : {};
    
    const models = await prisma.vehicleModel.findMany({
      where: whereClause,
      include: {
        make: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    
    return NextResponse.json(models);
  } catch (error) {
    console.error("Error fetching vehicle models:", error);
    return NextResponse.json(
      { error: "Failed to fetch vehicle models" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.makeId) {
      return NextResponse.json(
        { error: "Model name and make ID are required" },
        { status: 400 }
      );
    }
    
    // Check if make exists
    const make = await prisma.vehicleMake.findUnique({
      where: { id: data.makeId },
    });
    
    if (!make) {
      return NextResponse.json(
        { error: "Vehicle make not found" },
        { status: 404 }
      );
    }
    
    // Check if model with the same name already exists for this make
    const existingModel = await prisma.vehicleModel.findFirst({
      where: {
        name: data.name,
        makeId: data.makeId,
      },
    });
    
    if (existingModel) {
      return NextResponse.json(
        { error: "A model with this name already exists for this make" },
        { status: 409 }
      );
    }
    
    // Create the new model
    const newModel = await prisma.vehicleModel.create({
      data: {
        name: data.name,
        makeId: data.makeId,
        description: data.description || null,
      },
      include: {
        make: true,
      },
    });
    
    return NextResponse.json(newModel, { status: 201 });
  } catch (error) {
    console.error("Error creating vehicle model:", error);
    return NextResponse.json(
      { error: "Failed to create vehicle model" },
      { status: 500 }
    );
  }
}