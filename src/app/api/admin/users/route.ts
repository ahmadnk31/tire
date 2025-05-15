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

// Schema for creating a user
const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["USER", "ADMIN", "RETAILER"]).default("USER"),
});

// GET all users
export async function GET(request: NextRequest) {
  const authCheck = await ensureAdmin();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error }, 
      { status: authCheck.status }
    );
  }
  
  try {
    const users = await prisma.user.findMany({
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
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" }, 
      { status: 500 }
    );
  }
}

// POST create a new user
export async function POST(request: NextRequest) {
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
    const result = createUserSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { name, email, password, role } = result.data;
    
    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create the user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
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
    
    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
