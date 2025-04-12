import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the avatar URL from the request
    const { fileUrl } = await request.json();
    
    if (!fileUrl) {
      return NextResponse.json(
        { error: "No file URL provided" },
        { status: 400 }
      );
    }

    // Update the user's avatar in the database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: fileUrl }
    });
    
    return NextResponse.json({ 
      avatarUrl: fileUrl,
      message: "Avatar updated successfully"
    });
    
  } catch (error) {
    console.error("Error updating avatar:", error);
    return NextResponse.json(
      { error: "Failed to update avatar" },
      { status: 500 }
    );
  }
}