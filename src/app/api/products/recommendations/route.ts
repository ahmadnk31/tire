import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    const categoryId = searchParams.get('categoryId');
    const brandId = searchParams.get('brandId');
    const width = parseInt(searchParams.get('width') || '0');
    const aspectRatio = parseInt(searchParams.get('aspectRatio') || '0');
    const rimDiameter = parseInt(searchParams.get('rimDiameter') || '0');
    const limit = parseInt(searchParams.get('limit') || '4');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Find similar products based on various factors
    const similarProducts = await prisma.product.findMany({
      where: {
        id: { not: productId }, // Exclude the current product
        isVisible: true,
        isDiscontinued: false,
        stock: { gt: 0 },
        OR: [
          // Same size (exact match is most relevant)
          {
            width,
            aspectRatio,
            rimDiameter,
          },
          // Same brand
          {
            brandId: brandId || undefined,
          },
          // Same category
          {
            categoryId: categoryId || undefined,
          },
          // Similar size (close match)
          {
            width: {
              gte: width - 10,
              lte: width + 10,
            },
            aspectRatio: {
              gte: aspectRatio - 5,
              lte: aspectRatio + 5,
            },
            rimDiameter,
          }
        ],
      },
      include: {
        brand: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      take: limit,
      orderBy: [
        { isFeatured: 'desc' },
        { reviews: { _count: 'desc' } },
      ],
    });

    // Calculate average ratings for each product
    const productsWithRatings = await Promise.all(
      similarProducts.map(async (product) => {
        if (product._count.reviews === 0) {
          return { ...product, averageRating: 0 };
        }

        const averageRating = await prisma.review.aggregate({
          where: {
            productId: product.id,
          },
          _avg: {
            rating: true,
          },
        });

        return {
          ...product,
          averageRating: averageRating._avg.rating || 0,
        };
      })
    );

    return NextResponse.json(productsWithRatings);
  } catch (error) {
    console.error('Error fetching product recommendations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
