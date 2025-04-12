import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-options"
import { prisma } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const imageUrl = formData.get("imageUrl") as string | null
    const imageKey = formData.get("imageKey") as string | null

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      name,
      description: description || null,
    }

    // If we have image information, update that too
    if (imageUrl && imageKey) {
      updateData.imageUrl = imageUrl;
      updateData.imageKey = imageKey;
    }

    const category = await prisma.category.update({
      where: {
        id: params.categoryId,
      },
      data: updateData,
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error("[CATEGORY_PATCH]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const category = await prisma.category.delete({
      where: {
        id: params.categoryId,
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error("[CATEGORY_DELETE]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}