import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

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

// Schema for updating a user
const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  role: z.enum(["USER", "ADMIN", "RETAILER"]).optional(),
});

// GET a specific user
export async function GET(
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
    const user = await prisma.user.findUnique({
      where: {
        id: params.userId,
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
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PATCH update a user
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
    const result = updateUserSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { name, email, password, role } = result.data;
    
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
    
    // Check if email is already used by another user
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: {
          email,
        },
      });
      
      if (emailExists) {
        return NextResponse.json(
          { error: "Email is already in use" },
          { status: 409 }
        );
      }
    }
    
    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (role) updateData.role = role;
    
    // Update the user
    const updatedUser = await prisma.user.update({
      where: {
        id: params.userId,
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE a user
export async function DELETE(
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
    
    // Delete the user
    await prisma.user.delete({
      where: {
        id: params.userId,
      },
    });
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
