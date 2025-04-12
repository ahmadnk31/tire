import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const modelId = searchParams.get("modelId");
    
    const whereClause = modelId ? { modelId } : {};
    
    const trims = await prisma.vehicleTrim.findMany({
      where: whereClause,
      include: {
        model: {
          include: {
            make: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
    
    return NextResponse.json(trims);
  } catch (error) {
    console.error("Error fetching vehicle trims:", error);
    return NextResponse.json(
      { error: "Failed to fetch vehicle trims" },
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
    if (!data.name || !data.modelId) {
      return NextResponse.json(
        { error: "Trim name and model ID are required" },
        { status: 400 }
      );
    }
    
    // Check if model exists
    const model = await prisma.vehicleModel.findUnique({
      where: { id: data.modelId },
    });
    
    if (!model) {
      return NextResponse.json(
        { error: "Vehicle model not found" },
        { status: 404 }
      );
    }
    
    // Check if trim with the same name already exists for this model
    const existingTrim = await prisma.vehicleTrim.findFirst({
      where: {
        name: data.name,
        modelId: data.modelId,
      },
    });
    
    if (existingTrim) {
      return NextResponse.json(
        { error: "A trim with this name already exists for this model" },
        { status: 409 }
      );
    }
    
    // Create the new trim
    const newTrim = await prisma.vehicleTrim.create({
      data: {
        name: data.name,
        modelId: data.modelId,
        description: data.description || null,
      },
      include: {
        model: {
          include: {
            make: true,
          },
        },
      },
    });
    
    return NextResponse.json(newTrim, { status: 201 });
  } catch (error) {
    console.error("Error creating vehicle trim:", error);
    return NextResponse.json(
      { error: "Failed to create vehicle trim" },
      { status: 500 }
    );
  }
}