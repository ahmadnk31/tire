import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db'

interface Params {
  params: {
    productId: string
  }
}

// DELETE /api/favorites/[productId] - Remove a product from favorites
export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return new NextResponse(
      JSON.stringify({ message: 'Unauthorized' }),
      { status: 401 }
    )
  }

  try {
    const { productId } = params

    if (!productId) {
      return new NextResponse(
        JSON.stringify({ message: 'Product ID is required' }),
        { status: 400 }
      )
    }

    // Delete the favorite
    await prisma.favorite.deleteMany({
      where: {
        userId: session.user.id,
        productId,
      },
    })

    return new NextResponse(
      JSON.stringify({ message: 'Favorite removed successfully' }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error removing from favorites:', error)
    return new NextResponse(
      JSON.stringify({ message: 'Error removing from favorites' }),
      { status: 500 }
    )
  }
}