import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { z } from "zod";

// Schema for validating notification preferences updates - now matches DB schema
const notificationPreferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  orderUpdates: z.boolean().default(true),
  promotionalEmails: z.boolean().default(false),
  inventoryAlerts: z.boolean().default(true),
  priceChanges: z.boolean().default(false),
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
    
    // Get user notification preferences
    const preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: session.user.id },
    });
    
    // If user doesn't have notification preferences yet, return defaults
    if (!preferences) {
      return NextResponse.json({
        emailNotifications: true,
        orderUpdates: true,
        promotionalEmails: false,
        inventoryAlerts: true,
        priceChanges: false,
      });
    }
    
    // Return the preferences directly - no need to map fields since they match DB schema
    return NextResponse.json({
      emailNotifications: preferences.emailNotifications,
      orderUpdates: preferences.orderUpdates,
      promotionalEmails: preferences.promotionalEmails,
      inventoryAlerts: preferences.inventoryAlerts,
      priceChanges: preferences.priceChanges,
    });
    
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification preferences" },
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
    const result = notificationPreferencesSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: result.error.format() },
        { status: 400 }
      );
    }
    
    const preferences = result.data;
    
    // Check if preferences already exist
    const existingPreferences = await prisma.notificationPreferences.findUnique({
      where: { userId: session.user.id },
    });
    
    let updatedPreferences;
    
    if (existingPreferences) {
      // Update existing preferences
      updatedPreferences = await prisma.notificationPreferences.update({
        where: { userId: session.user.id },
        data: {
          emailNotifications: preferences.emailNotifications,
          orderUpdates: preferences.orderUpdates,
          promotionalEmails: preferences.promotionalEmails,
          inventoryAlerts: preferences.inventoryAlerts,
          priceChanges: preferences.priceChanges,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new preferences
      updatedPreferences = await prisma.notificationPreferences.create({
        data: {
          userId: session.user.id,
          emailNotifications: preferences.emailNotifications,
          orderUpdates: preferences.orderUpdates,
          promotionalEmails: preferences.promotionalEmails,
          inventoryAlerts: preferences.inventoryAlerts,
          priceChanges: preferences.priceChanges,
        },
      });
    }
    
    // Return the updated preferences
    return NextResponse.json({
      ...updatedPreferences,
      message: "Notification preferences updated successfully",
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to update notification preferences" },
      { status: 500 }
    );
  }
}