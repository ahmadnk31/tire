import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { z } from "zod";

// Schema for validating profile update requests
const profileUpdateSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get user profile data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        role: true,
        notificationPreferences: true,
        retailerProfile: session.user.role === "RETAILER",
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      ...user,
      // Add any additional profile data transformation here
      avatar: user.image,
      phoneNumber: "", // You might want to add this to your User model
      address: "", // You might want to add this to your User model
      notifications: {
        emailNotifications: user.notificationPreferences?.emailNotifications || true,
        orderUpdates: user.notificationPreferences?.orderUpdates || true,
        promotionalEmails: user.notificationPreferences?.promotionalEmails || false,
        inventoryAlerts: user.notificationPreferences?.inventoryAlerts || true,
        priceChanges: user.notificationPreferences?.priceChanges || false,
      }
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Validate request data
    const result = profileUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { name, email, phoneNumber, address } = result.data;
    
    // Check if email is already used by another user
    if (email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      
      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: "Email is already in use by another account" },
          { status: 400 }
        );
      }
    }
    
    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        email,
        // Add phoneNumber and address to your User model or handle them separately
      },
    });
    
    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.image,
        phoneNumber, // You'd need to add this field to your User model
        address, // You'd need to add this field to your User model
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}