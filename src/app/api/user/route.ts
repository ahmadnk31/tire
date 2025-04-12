import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { hash } from "bcryptjs";
import { z } from "zod";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db";

// Schema for creating a new user
const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  role: z.enum(["USER", "ADMIN", "RETAILER"]),
  image: z.string().optional(),
  createdAt: z.date().optional(),
});

// GET all users
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and has admin rights
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse(
        JSON.stringify({
          error: "Unauthorized",
        }),
        { status: 401 }
      );
    }

    // Get all users from the database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}

// POST a new user
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and has admin rights
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse(
        JSON.stringify({
          error: "Unauthorized",
        }),
        { status: 401 }
      );
    }

    const body = await req.json();
    
    // Validate input
    const validatedData = userSchema.parse(body);

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: validatedData.email,
      },
    });

    if (existingUser) {
      return new NextResponse(
        JSON.stringify({
          error: "A user with this email already exists.",
        }),
        { status: 409 }
      );
    }

    // Create the user
    const userData = {
      name: validatedData.name,
      email: validatedData.email,
      role: validatedData.role,
      password: validatedData.password 
        ? await hash(validatedData.password, 10) 
        : await hash("defaultPassword123", 10), // Provide a default password if none is given
    };

    // Add image if provided
    if (validatedData.image) {
      Object.assign(userData, {
        image: validatedData.image,
      });
    }

    const newUser = await prisma.user.create({
      data: userData,
    });

    // Return the created user without the password
    return NextResponse.json(
      {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        image: newUser.image,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({
          error: "Invalid input data",
          details: error.errors,
        }),
        { status: 400 }
      );
    }

    console.error("Error creating user:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}