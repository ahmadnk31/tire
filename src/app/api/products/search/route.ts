import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    if (!query) {
      return NextResponse.json({ products: [], total: 0 });
    }

    // Perform a multi-field search on the product data
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          isVisible: true,
          isDiscontinued: false,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { manufacturerPartNumber: { contains: query, mode: 'insensitive' } },
            {
              brand: {
                name: { contains: query, mode: 'insensitive' }
              }
            },
            {
              model: {
                name: { contains: query, mode: 'insensitive' }
              }
            },
            {
              category: {
                name: { contains: query, mode: 'insensitive' }
              }
            }
          ]
        },
        select: {
          id: true,
          name: true,
          brand: {
            select: {
              name: true
            }
          },
          width: true,
          aspectRatio: true,
          rimDiameter: true,
          speedRating: true,
          images: true,
          retailPrice: true,
          discount: true,
          salePrice: true
        },
        orderBy: [
          { isFeatured: 'desc' },
          { name: 'asc' }
        ],
        take: limit,
        skip: skip
      }),
      prisma.product.count({
        where: {
          isVisible: true,
          isDiscontinued: false,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { manufacturerPartNumber: { contains: query, mode: 'insensitive' } },
            {
              brand: {
                name: { contains: query, mode: 'insensitive' }
              }
            },
            {
              model: {
                name: { contains: query, mode: 'insensitive' }
              }
            },
            {
              category: {
                name: { contains: query, mode: 'insensitive' }
              }
            }
          ]
        }
      })
    ]);

    return NextResponse.json({
      products,
      total
    });
  } catch (error) {
    console.error("Error searching products:", error);
    return NextResponse.json(
      { error: "Failed to search products", products: [], total: 0 },
      { status: 500 }
    );
  }
}