import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Ensure the request is from an admin
async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return { authorized: false, error: "Unauthorized", status: 401 };
  }
  
  if (session.user.role !== "ADMIN") {
    return { authorized: false, error: "Forbidden", status: 403 };
  }
  
  return { authorized: true };
}

// Schema for setting ban status
const banSchema = z.object({
  isBanned: z.boolean(),
});

// PATCH - update user ban status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const authCheck = await ensureAdmin();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error }, 
      { status: authCheck.status }
    );
  }
  
  try {
    const body = await request.json();
    
    // Validate request data
    const result = banSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { isBanned } = result.data;
    
    // Check if the user exists
    const existingUser = await prisma.user.findUnique({
      where: {
        id: params.userId,
      },
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Update the user ban status
    // Note: We're assuming there's a 'banned' field in the user model
    // You may need to adjust this according to your actual data model
    const updatedUser = await prisma.user.update({
      where: {
        id: params.userId,
      },
      data: {
        isBanned,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        isBanned: true,
      },
    });
    
    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("Error updating user ban status:", error);
    return NextResponse.json(
      { error: "Failed to update user ban status" },
      { status: 500 }
    );
  }
}
