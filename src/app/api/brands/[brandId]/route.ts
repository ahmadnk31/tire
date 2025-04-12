import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-options"
import { prisma } from "@/lib/db"
import { uploadFile } from "@/lib/utils/upload-helpers"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { brandId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const logo = formData.get("logo") as File | null
    const logoUrl = formData.get("logoUrl") as string | null
    const isActive = formData.get("isActive") as string | null
    const popularityScore = formData.get("popularityScore") as string | null
    const logoKey = formData.get("logoKey") as string | null
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
      isActive: isActive === 'true',
      popularityScore: popularityScore ? parseInt(popularityScore, 10) : null,
    }

    // If we have a new file uploaded, use that URL
    if (logoUrl && logoKey) {
      updateData.logoUrl = logoUrl;
      updateData.logoKey = logoKey;
    } 
    // If a logo file was directly provided, upload it
    else if (logo) {
      try {
        // Convert File to Buffer for S3 upload
        const fileBuffer = Buffer.from(await logo.arrayBuffer());
        
        // Upload to S3 through API
        const formData = new FormData();
        formData.append('file', logo);
        formData.append('folder', 'brands');
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload logo');
        }
        
        const { fileUrl, key } = await uploadResponse.json();
        updateData.logoUrl = fileUrl;
        updateData.logoKey = key;
      } catch (error) {
        console.error("[LOGO_UPLOAD_ERROR]", error);
        return NextResponse.json(
          { error: "Failed to upload logo" },
          { status: 500 }
        );
      }
    }

    const brand = await prisma.brand.update({
      where: {
        id: params.brandId,
      },
      data: updateData,
    })

    return NextResponse.json(brand)
  } catch (error) {
    console.error("[BRAND_PATCH]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Delete handler remains the same
export async function DELETE(
  request: NextRequest,
  { params }: { params: { brandId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const brand = await prisma.brand.delete({
      where: {
        id: params.brandId,
      },
    })

    return NextResponse.json(brand)
  } catch (error) {
    console.error("[BRAND_DELETE]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}