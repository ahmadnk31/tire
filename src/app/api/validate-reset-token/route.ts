import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get the token from the URL query parameters
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    // Check if token exists
    if (!token) {
      return NextResponse.json(
        { message: "Token is required" },
        { status: 400 }
      );
    }

    // Find the token in the database
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    // If no token found or token has expired
    if (!resetToken || resetToken.expires < new Date()) {
      // If token exists but has expired, delete it
      if (resetToken) {
        await prisma.passwordResetToken.delete({
          where: { id: resetToken.id },
        });
      }

      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Token is valid
    return NextResponse.json(
      { message: "Token is valid" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in validate-reset-token API:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}