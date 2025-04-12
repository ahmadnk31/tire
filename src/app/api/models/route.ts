import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const models = await prisma.model.findMany({
      include: {
        brand: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return NextResponse.json(models);
  } catch (error) {
    console.error("[MODELS_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();
    
    const { name, description, brandId } = body;
    
    if (!name || !brandId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Check if the brand exists
    const brandExists = await prisma.brand.findUnique({
      where: { id: brandId },
    });
    
    if (!brandExists) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }
    
    // Check if a model with the same name already exists for this brand
    const existingModel = await prisma.model.findFirst({
      where: {
        name,
        brandId,
      },
    });
    
    if (existingModel) {
      return NextResponse.json(
        { error: "A model with this name already exists for this brand" },
        { status: 400 }
      );
    }
    
    const model = await prisma.model.create({
      data: {
        name,
        description,
        brandId,
      },
    });
    
    return NextResponse.json(model);
  } catch (error) {
    console.error("[MODELS_POST]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}