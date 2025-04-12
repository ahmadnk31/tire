import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db'

// GET /api/favorites - Get all favorites for the current user
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return new NextResponse(
      JSON.stringify({ message: 'Unauthorized' }),
      { status: 401 }
    )
  }

  try {
    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true,
            retailPrice: true,
            salePrice: true,
            discount: true,
            width: true,
            aspectRatio: true,
            rimDiameter: true,
            speedRating: true,
            brand: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(favorites)
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return new NextResponse(
      JSON.stringify({ message: 'Error fetching favorites' }),
      { status: 500 }
    )
  }
}

// POST /api/favorites - Add a product to favorites
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return new NextResponse(
      JSON.stringify({ message: 'Unauthorized' }),
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { productId } = body

    if (!productId) {
      return new NextResponse(
        JSON.stringify({ message: 'Product ID is required' }),
        { status: 400 }
      )
    }

    // Check if the product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return new NextResponse(
        JSON.stringify({ message: 'Product not found' }),
        { status: 404 }
      )
    }

    // Check if the favorite already exists
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId: session.user.id,
        productId,
      },
    })

    if (existingFavorite) {
      return new NextResponse(
        JSON.stringify({ message: 'Product already in favorites' }),
        { status: 200 }
      )
    }

    // Add to favorites
    const favorite = await prisma.favorite.create({
      data: {
        user: {
          connect: { id: session.user.id },
        },
        product: {
          connect: { id: productId },
        },
      },
    })

    return NextResponse.json(favorite)
  } catch (error) {
    console.error('Error adding to favorites:', error)
    return new NextResponse(
      JSON.stringify({ message: 'Error adding to favorites' }),
      { status: 500 }
    )
  }
}