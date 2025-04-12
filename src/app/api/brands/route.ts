import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-options"
import { prisma } from "@/lib/db"
import { BrandSearchParamsSchema } from '@/lib/api/brand-api';
import { Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const logoUrl = formData.get("logoUrl") as string | null
    const isActive = formData.get("isActive") as string | null
    const popularityScore = formData.get("popularityScore") as string | null
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        description: description || null,
        logoUrl: logoUrl || null,
        isActive: isActive === 'true',
        popularityScore: popularityScore ? parseInt(popularityScore, 10) : null
      },
    })

    return NextResponse.json(brand)
  } catch (error) {
    console.error("[BRAND_POST]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const validatedParams = BrandSearchParamsSchema.parse({
      query: searchParams.get('query') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1,
      perPage: searchParams.get('perPage') ? parseInt(searchParams.get('perPage')!, 10) : 20,
      sort: searchParams.get('sort') || 'name',
      order: searchParams.get('order') || 'asc',
    });
    
    const { query, page, perPage, sort, order } = validatedParams;
    
    // Build filter conditions
    const where = {
      ...(query ? {
        OR: [
          { name: { contains: query, mode: Prisma.QueryMode.insensitive } },
          { description: { contains: query, mode: Prisma.QueryMode.insensitive } },
        ],
      } : {}),
    };
    
    // Count total matching brands for pagination
    const totalCount = await prisma.brand.count({
      where,
    });
    
    // Fetch brands with pagination and sorting
    const brands = await prisma.brand.findMany({
      where,
      orderBy: {
        [sort]: order,
      },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        _count: {
          select: { products: true },
        }
      }
    });
    
    // Map brands to include formatted data and product count
    const formattedBrands = brands.map(brand => ({
      id: brand.id,
      name: brand.name,
      description: brand.description,
      logoUrl: brand.logoUrl,
      isActive: brand.isActive,
      popularityScore: brand.popularityScore,
      productCount: brand._count.products,
      createdAt: brand.createdAt.toISOString(),
      updatedAt: brand.updatedAt.toISOString(),
    }));
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / perPage);
    
    return NextResponse.json({
      brands: formattedBrands,
      totalCount,
      page,
      perPage,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
}