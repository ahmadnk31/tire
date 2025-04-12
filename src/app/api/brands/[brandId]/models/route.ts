import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";


export async function GET(
  req: NextRequest,
  { params }: { params: { brandId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { brandId } = await params;
    
    if (!brandId) {
      return NextResponse.json({ error: "Brand ID is required" }, { status: 400 });
    }
    
    // Check if the brand exists
    const brandExists = await prisma.brand.findUnique({
      where: { id: brandId },
    });
    
    if (!brandExists) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }
    
    const models = await prisma.model.findMany({
      where: {
        brandId,
      },
      orderBy: {
        name: "asc",
      },
    });
    
    return NextResponse.json(models);
  } catch (error) {
    console.error("[BRAND_MODELS_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}