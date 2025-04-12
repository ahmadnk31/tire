import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-options"
import { prisma } from "@/lib/db"
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Category search parameters schema
const CategorySearchParamsSchema = z.object({
  query: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(["name", "productCount", "createdAt"]).default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }    const formData = await request.formData()
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const imageUrl = formData.get("imageUrl") as string | null
    const isActive = formData.get("isActive") as string | null
    const displayOrder = formData.get("displayOrder") as string | null
    const imageKey = formData.get("imageKey") as string | null
    
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        isActive: isActive === 'true',
        displayOrder: displayOrder ? parseInt(displayOrder, 10) : 0,
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error("[CATEGORY_POST]", error)
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
    const validatedParams = CategorySearchParamsSchema.parse({
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
    
    // Count total matching categories for pagination
    const totalCount = await prisma.category.count({
      where,
    });
    
    // Fetch categories with pagination and sorting
    const categories = await prisma.category.findMany({
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
    
    // Map categories to include formatted data and product count
    const formattedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl,
      isActive: category.isActive,
      displayOrder: category.displayOrder,
      productCount: category._count.products,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    }));
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / perPage);
    
    return NextResponse.json({
      categories: formattedCategories,
      totalCount,
      page,
      perPage,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}