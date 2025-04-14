import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

// GET all promotions
export async function GET() {
  try {
    const promotions = await prisma.promotion.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        products: { select: { id: true } },
        brands: { select: { id: true } },
        categories: { select: { id: true } },
        subscriberGroups: { select: { id: true } },
      },
    });
    
    return NextResponse.json(promotions);
  } catch (error) {
    console.error("[PROMOTIONS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch promotions" },
      { status: 500 }
    );
  }
}

// POST new promotion
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is admin
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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
    const { products, brands, categories, subscriberGroups, ...data } = body;
    
    // Create new promotion
    const promotion = await prisma.promotion.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        // Handle relationships with connect
        products: products ? {
          connect: products.map((id: string) => ({ id }))
        } : undefined,
        brands: brands ? {
          connect: brands.map((id: string) => ({ id }))
        } : undefined,
        categories: categories ? {
          connect: categories.map((id: string) => ({ id }))
        } : undefined,
        subscriberGroups: subscriberGroups ? {
          connect: subscriberGroups.map((id: string) => ({ id }))
        } : undefined,
      },
      include: {
        products: { select: { id: true, name: true } },
        brands: { select: { id: true, name: true } },
        categories: { select: { id: true, name: true } },
        subscriberGroups: { select: { id: true, name: true } },
      }
    });
    
    return NextResponse.json(promotion);
  } catch (error) {
    console.error("Failed to create promotion:", error);
    return NextResponse.json(
      { error: "Failed to create promotion" },
      { status: 500 }
    );
  }
}

// Export config for dynamic API route
export const dynamic = 'force-dynamic';
