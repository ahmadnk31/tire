import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { emailNotifications, orderUpdates, promotionalEmails, inventoryAlerts, priceChanges } = await req.json();
    
    // Check if preferences already exist
    const existingPreferences = await prisma.notificationPreferences.findUnique({
      where: {
        userId: session.user.id,
      },
    });
    
    let notificationPreferences;
    
    if (existingPreferences) {
      // Update existing preferences
      notificationPreferences = await prisma.notificationPreferences.update({
        where: {
          userId: session.user.id,
        },
        data: {
          emailNotifications,
          orderUpdates,
          promotionalEmails,
          inventoryAlerts,
          priceChanges,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new preferences
      notificationPreferences = await prisma.notificationPreferences.create({
        data: {
          userId: session.user.id,
          emailNotifications,
          orderUpdates,
          promotionalEmails,
          inventoryAlerts,
          priceChanges,
        },
      });
    }
    
    return NextResponse.json({
      notificationPreferences,
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