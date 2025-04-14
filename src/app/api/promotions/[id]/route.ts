import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const promotion = await prisma.promotion.findUnique({
      where: { id: params.id },
      include: {
        products: true,
        brands: true,
        categories: true,
        subscriberGroups: true,
        models: true,
      }
    });
    
    if (!promotion) {
      return NextResponse.json(
        { error: "Promotion not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(promotion);
  } catch (error) {
    console.error(`Error fetching promotion ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch promotion" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is admin
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get the promotion by ID first to check if it exists
    const existingPromotion = await prisma.promotion.findUnique({
      where: { id: params.id },
    });
    
    if (!existingPromotion) {
      return NextResponse.json(
        { error: "Promotion not found" },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.description || !body.type || !body.startDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Extract relationship fields to handle them separately
    const { products, brands, categories, subscriberGroups, models, ...data } = body;
    
    // Prepare update data
    const updateData = {
      ...data,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
    };    // Update the promotion with relationships
    const promotion = await prisma.promotion.update({
      where: { id: params.id },
      data: {
        ...updateData,
        // Handle relationship disconnects and connects
        products: products && products.length > 0 ? {
          set: [], // Disconnect all first
          connect: products.map((id: string) => ({ id }))
        } : { set: [] }, // Just disconnect all if no products provided
        brands: brands && brands.length > 0 ? {
          set: [], // Disconnect all first
          connect: brands.map((id: string) => ({ id }))
        } : { set: [] },
        categories: categories && categories.length > 0 ? {
          set: [], // Disconnect all first
          connect: categories.map((id: string) => ({ id }))
        } : { set: [] },
        subscriberGroups: subscriberGroups && subscriberGroups.length > 0 ? {
          set: [], // Disconnect all first
          connect: subscriberGroups.map((id: string) => ({ id }))
        } : { set: [] },
        models: models && models.length > 0 ? {
          set: [], // Disconnect all first
          connect: models.map((id: string) => ({ id }))
        } : { set: [] }
      },
      include: {
        products: { select: { id: true, name: true } },
        brands: { select: { id: true, name: true } },
        categories: { select: { id: true, name: true } },
        subscriberGroups: { select: { id: true, name: true } },
        models: { select: { id: true, name: true } },
      }
    });
    
    return NextResponse.json(promotion);
  } catch (error) {
    console.error(`Error updating promotion ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to update promotion" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is admin
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if promotion exists
    const promotion = await prisma.promotion.findUnique({
      where: { id: params.id },
    });
    
    if (!promotion) {
      return NextResponse.json(
        { error: "Promotion not found" },
        { status: 404 }
      );
    }
    
    // Delete the promotion
    await prisma.promotion.delete({
      where: { id: params.id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting promotion ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to delete promotion" },
      { status: 500 }
    );
  }
}
