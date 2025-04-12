import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: Params) {
  const { id } = params;
  const { searchParams } = new URL(request.url);
  
  // Parse pagination parameters
  const page = searchParams.has('page') ? parseInt(searchParams.get('page')!, 10) : 1;
  const perPage = searchParams.has('perPage') ? parseInt(searchParams.get('perPage')!, 10) : 20;
  
  try {
    // Verify the category exists first
    const categoryExists = await prisma.category.findUnique({
      where: { id },
      select: { id: true }
    });
    
    if (!categoryExists) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }
    
    // Count total products for this category
    const totalCount = await prisma.product.count({
      where: { categoryId: id }
    });
    
    // Fetch products for the category with pagination
    const products = await prisma.product.findMany({
      where: { categoryId: id },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
          }
        },
        model: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { name: 'asc' },
    });
    
    // Format products data
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      retailPrice: product.retailPrice,
      salePrice: product.salePrice,
      discount: product.discount,
      width: product.width,
      aspectRatio: product.aspectRatio,
      rimDiameter: product.rimDiameter,
      loadIndex: product.loadIndex,
      speedRating: product.speedRating,
      images: product.images,
      brandId: product.brandId,
      modelId: product.modelId,
      categoryId: product.categoryId,
      brand: product.brand,
      model: product.model,
    }));
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / perPage);
    
    return NextResponse.json({
      products: formattedProducts,
      totalCount,
      page,
      perPage,
      totalPages,
    });
  } catch (error) {
    console.error(`Error fetching products for category ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch products for this category' },
      { status: 500 }
    );
  }
}