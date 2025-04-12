import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { hash } from "bcryptjs";

// Schema for validating reset password request
const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    const validatedData = resetPasswordSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Invalid input data" },
        { status: 400 }
      );
    }

    const { token, password } = validatedData.data;

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

    // Find the user by email (identifier)
    const user = await prisma.user.findUnique({
      where: { email: resetToken.identifier },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Hash the new password
    const hashedPassword = await hash(password, 10);

    // Update the user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Delete the used token
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in reset-password API:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}