import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";


export async function GET(
  req: NextRequest,
  { params }: { params: { modelId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { modelId } = params;
    
    if (!modelId) {
      return NextResponse.json({ error: "Model ID is required" }, { status: 400 });
    }
    
    const model = await prisma.model.findUnique({
      where: {
        id: modelId,
      },
      include: {
        brand: true,
        products: {
          select: {
            id: true,
            name: true
          },
        },
      },
    });
    
    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }
    
    return NextResponse.json(model);
  } catch (error) {
    console.error("[MODEL_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { modelId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { modelId } = params;
    
    if (!modelId) {
      return NextResponse.json({ error: "Model ID is required" }, { status: 400 });
    }
    
    const body = await req.json();
    
    const { name, description, brandId } = body;
    
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    
    // Check if model exists
    const modelExists = await prisma.model.findUnique({
      where: {
        id: modelId,
      },
    });
    
    if (!modelExists) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }
    
    // If brandId is being updated, check if the brand exists
    if (brandId && brandId !== modelExists.brandId) {
      const brandExists = await prisma.brand.findUnique({
        where: { id: brandId },
      });
      
      if (!brandExists) {
        return NextResponse.json({ error: "Brand not found" }, { status: 404 });
      }
      
      // Check if a model with the same name already exists for the new brand
      const duplicateModel = await prisma.model.findFirst({
        where: {
          name,
          brandId,
          id: { not: modelId },
        },
      });
      
      if (duplicateModel) {
        return NextResponse.json(
          { error: "A model with this name already exists for this brand" },
          { status: 400 }
        );
      }
    } else if (name !== modelExists.name) {
      // Check if name is being updated and if it would cause a duplicate
      const duplicateModel = await prisma.model.findFirst({
        where: {
          name,
          brandId: modelExists.brandId,
          id: { not: modelId },
        },
      });
      
      if (duplicateModel) {
        return NextResponse.json(
          { error: "A model with this name already exists for this brand" },
          { status: 400 }
        );
      }
    }
    
    // Update the model
    const updatedModel = await prisma.model.update({
      where: {
        id: modelId,
      },
      data: {
        name,
        description,
        ...(brandId && { brandId }),
      },
    });
    
    return NextResponse.json(updatedModel);
  } catch (error) {
    console.error("[MODEL_PATCH]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { modelId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { modelId } = params;
    
    if (!modelId) {
      return NextResponse.json({ error: "Model ID is required" }, { status: 400 });
    }
    
    // Check if model exists
    const model = await prisma.model.findUnique({
      where: {
        id: modelId,
      },
      include: {
        products: true,
      },
    });
    
    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }
    
    // Check if the model has associated products
    if (model.products.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete model with associated products" },
        { status: 400 }
      );
    }
    
    // Delete the model
    await prisma.model.delete({
      where: {
        id: modelId,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MODEL_DELETE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}