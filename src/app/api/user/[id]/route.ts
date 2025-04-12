import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { hash } from "bcryptjs";
import { z } from "zod";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db";

// Schema for updating a user
const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(["USER", "ADMIN", "RETAILER"]).optional(),
  image: z.string().optional(),
});

// GET a specific user
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if ID is provided
    if (!params.id) {
      return new NextResponse(
        JSON.stringify({
          error: "User ID is required",
        }),
        { status: 400 }
      );
    }

    // Get user from the database
    const user = await prisma.user.findUnique({
      where: {
        id: params.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return new NextResponse(
        JSON.stringify({
          error: "User not found",
        }),
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}

// PUT (update) a specific user
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if ID is provided
    if (!params.id) {
      return new NextResponse(
        JSON.stringify({
          error: "User ID is required",
        }),
        { status: 400 }
      );
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!userExists) {
      return new NextResponse(
        JSON.stringify({
          error: "User not found",
        }),
        { status: 404 }
      );
    }

    const body = await req.json();
    
    // Validate input
    const validatedData = userUpdateSchema.parse(body);

    // Check if email is being updated and is not already in use by another user
    if (validatedData.email && validatedData.email !== userExists.email) {
      const existingUser = await prisma.user.findUnique({
        where: {
          email: validatedData.email,
        },
      });

      if (existingUser && existingUser.id !== params.id) {
        return new NextResponse(
          JSON.stringify({
            error: "A user with this email already exists.",
          }),
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.email) updateData.email = validatedData.email;
    if (validatedData.role) updateData.role = validatedData.role;
    if (validatedData.image !== undefined) updateData.image = validatedData.image;
    
    // Hash password if provided
    if (validatedData.password) {
      updateData.password = await hash(validatedData.password, 10);
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: {
        id: params.id,
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
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

    console.error("Error updating user:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}

// DELETE a specific user
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if ID is provided
    if (!params.id) {
      return new NextResponse(
        JSON.stringify({
          error: "User ID is required",
        }),
        { status: 400 }
      );
    }

    // Prevent deletion of the current user
    if (session.user.id === params.id) {
      return new NextResponse(
        JSON.stringify({
          error: "You cannot delete your own account",
        }),
        { status: 400 }
      );
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!userExists) {
      return new NextResponse(
        JSON.stringify({
          error: "User not found",
        }),
        { status: 404 }
      );
    }

    // Delete the user
    await prisma.user.delete({
      where: {
        id: params.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting user:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}