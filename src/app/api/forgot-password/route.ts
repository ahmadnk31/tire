import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/aws/ses-utils";

// Schema for validating request data
const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please provide a valid email" }),
});

// Function to generate a reset token
function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    const validatedData = forgotPasswordSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Invalid input data" },
        { status: 400 }
      );
    }

    const { email } = validatedData.data;

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // If no user is found, don't reveal this information but still return a success response
    // This is a security measure to prevent email enumeration
    if (!user) {
      return NextResponse.json(
        { message: "If your email exists in our system, you'll receive a password reset link" },
        { status: 200 }
      );
    }

    // Generate a token with expiration (1 hour from now)
    const token = generateResetToken();
    const expires = new Date(Date.now() + 3600000); // 1 hour from now

    // Delete any existing reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { identifier: email },
    });

    // Create a new reset token
    await prisma.passwordResetToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // Send the password reset email using the utility function
    await sendPasswordResetEmail(email, user.name, token);

    return NextResponse.json(
      { message: "If your email exists in our system, you'll receive a password reset link" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in forgot-password API:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}