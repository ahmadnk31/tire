import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

// PATCH - Toggle promotion active status
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user is an admin
    if (session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return new NextResponse("isActive must be a boolean", { status: 400 });
    }

    // Update promotion active status
    const promotion = await prisma.promotion.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json(promotion);
  } catch (error) {
    console.error("[PROMOTION_TOGGLE_ACTIVE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
