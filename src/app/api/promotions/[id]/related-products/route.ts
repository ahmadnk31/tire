import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const promotionId = params.id;

    if (!promotionId) {
      return NextResponse.json(
        { error: "Promotion ID is required" },
        { status: 400 }
      );
    }

    // Fetch the promotion to verify it exists
    const promotion = await prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promotion) {
      return NextResponse.json(
        { error: "Promotion not found" },
        { status: 404 }
      );
    }    // Get products directly related to this promotion
    const relatedProducts = await prisma.product.findMany({
      where: {
        promotionId: promotionId
      },
      select: {
        id: true,
        name: true,
        description: true,
        retailPrice: true,
        wholesalePrice: true,
        discount: true,
        salePrice: true,
        images: true,
        brand: {
          select: {
            name: true
          }
        },
        model: {
          select: {
            name: true
          }
        }
      },
      take: 6 // Limit to avoid loading too many products
    });

    // If no direct products, try to get products from the same brands or categories that are in the promotion
    if (relatedProducts.length === 0) {
      // Get brands and categories associated with this promotion
      const promotionWithRelations = await prisma.promotion.findUnique({
        where: { id: promotionId },
        include: {
          brands: { select: { id: true } },
          categories: { select: { id: true } }
        }
      });

      if (promotionWithRelations?.brands?.length || promotionWithRelations?.categories?.length) {
        // Get products from related brands or categories
        const brandsIds = promotionWithRelations.brands.map(b => b.id);
        const categoriesIds = promotionWithRelations.categories.map(c => c.id);

        const indirectRelatedProducts = await prisma.product.findMany({
          where: {
            OR: [
              { brandId: { in: brandsIds.length > 0 ? brandsIds : undefined } },
              { categoryId: { in: categoriesIds.length > 0 ? categoriesIds : undefined } }
            ]
          },          select: {
            id: true,
            name: true,
            description: true,
            retailPrice: true,
            wholesalePrice: true,
            discount: true,
            salePrice: true,
            images: true,
            brand: {
              select: {
                name: true
              }
            },
            model: {
              select: {
                name: true
              }
            }
          },
          take: 6
        });

        return NextResponse.json(indirectRelatedProducts);
      }
    }

    return NextResponse.json(relatedProducts);
  } catch (error) {
    console.error("[PROMOTION_RELATED_PRODUCTS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch related products" },
      { status: 500 }
    );
  }
}

// Force dynamic execution
export const dynamic = 'force-dynamic';
