import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    // Search parameters
    const query = searchParams.get('query') || '';
    const brand = searchParams.get('brand');
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    
    // Tire-specific specifications
    const width = searchParams.get('width') ? parseInt(searchParams.get('width')!) : undefined;
    const aspectRatio = searchParams.get('aspectRatio') ? parseInt(searchParams.get('aspectRatio')!) : undefined;
    const rimDiameter = searchParams.get('rimDiameter') ? parseInt(searchParams.get('rimDiameter')!) : undefined;
    const speedRating = searchParams.get('speedRating');
    const loadIndex = searchParams.get('loadIndex') ? parseInt(searchParams.get('loadIndex')!) : undefined;
    const season = searchParams.get('season');
    
    // Build filter object
    const where: any = {};
    
    // Keyword search - search in name, description, and manufacturer part number
    if (query) {
      where.OR = [
        {
          name: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          manufacturerPartNumber: {
            contains: query,
            mode: 'insensitive'
          }
        }
      ];
    }
    
    // Brand filter
    if (brand) {
      where.brand = {
        name: {
          contains: brand,
          mode: 'insensitive'
        }
      };
    }
    
    // Category filter
    if (category) {
      where.category = {
        name: {
          contains: category,
          mode: 'insensitive'
        }
      };
    }
    
    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.retailPrice = {};
      
      if (minPrice !== undefined) {
        where.retailPrice.gte = minPrice;
      }
      
      if (maxPrice !== undefined) {
        where.retailPrice.lte = maxPrice;
      }
    }
    
    // Tire specification filters
    if (width !== undefined) {
      where.width = width;
    }
    
    if (aspectRatio !== undefined) {
      where.aspectRatio = aspectRatio;
    }
    
    if (rimDiameter !== undefined) {
      where.rimDiameter = rimDiameter;
    }
    
    if (speedRating) {
      where.speedRating = {
        contains: speedRating,
        mode: 'insensitive'
      };
    }
    
    if (loadIndex !== undefined) {
      where.loadIndex = loadIndex;
    }
    
    // Season filter (mapped to snowRating for winter tires)
    if (season === 'winter') {
      where.snowRating = {
        not: ''
      };
    }
    
    // Only show products with stock available
    where.stock = {
      gt: 0
    };
    
    // Query products with counts
    const [products, totalCount, facets] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              logoUrl: true
            }
          },
          category: {
            select: {
              id: true,
              name: true
            }
          },
          model: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.product.count({ where }),
      // Get facets for filtering
      getFacets(where)
    ]);
    
    return NextResponse.json({
      products,
      facets,
      meta: {
        currentPage: page,
        pageSize: limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      }
    });
    
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}

// Helper function to get facets for filtering
async function getFacets(baseWhere: any): Promise<any> {
  // Copy the base where clause without the specific property we're aggregating
  const brandWhere = { ...baseWhere };
  delete brandWhere.brand;
  
  const categoryWhere = { ...baseWhere };
  delete categoryWhere.category;
  
  const widthWhere = { ...baseWhere };
  delete widthWhere.width;
  
  const aspectRatioWhere = { ...baseWhere };
  delete aspectRatioWhere.aspectRatio;
  
  const rimDiameterWhere = { ...baseWhere };
  delete rimDiameterWhere.rimDiameter;
  
  // Execute facet queries in parallel
  const [brands, categories, widths, aspectRatios, rimDiameters, speedRatings] = await Promise.all([
    // Get unique brands
    prisma.brand.findMany({
      where: {
        products: {
          some: brandWhere
        }
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            products: {
              where: brandWhere
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    }),
    
    // Get unique categories
    prisma.category.findMany({
      where: {
        products: {
          some: categoryWhere
        }
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            products: {
              where: categoryWhere
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    }),
    
    // Get unique widths
    prisma.product.groupBy({
      by: ['width'],
      where: widthWhere,
      _count: true,
      orderBy: {
        width: 'asc'
      }
    }),
    
    // Get unique aspect ratios
    prisma.product.groupBy({
      by: ['aspectRatio'],
      where: aspectRatioWhere,
      _count: true,
      orderBy: {
        aspectRatio: 'asc'
      }
    }),
    
    // Get unique rim diameters
    prisma.product.groupBy({
      by: ['rimDiameter'],
      where: rimDiameterWhere,
      _count: true,
      orderBy: {
        rimDiameter: 'asc'
      }
    }),
    
    // Get unique speed ratings
    prisma.product.groupBy({
      by: ['speedRating'],
      where: baseWhere,
      _count: true,
      orderBy: {
        speedRating: 'asc'
      }
    })
  ]);
  
  return {
    brands: brands.map(b => ({
      id: b.id,
      name: b.name,
      count: b._count.products
    })),
    categories: categories.map(c => ({
      id: c.id,
      name: c.name,
      count: c._count.products
    })),
    widths: widths.map(w => ({
      value: w.width,
      count: w._count
    })),
    aspectRatios: aspectRatios.map(a => ({
      value: a.aspectRatio,
      count: a._count
    })),
    rimDiameters: rimDiameters.map(r => ({
      value: r.rimDiameter,
      count: r._count
    })),
    speedRatings: speedRatings.map(s => ({
      value: s.speedRating,
      count: s._count
    }))
  };
}