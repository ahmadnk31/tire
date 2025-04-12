import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Testimonial submission schema
const testimonialSchema = z.object({
  customerTitle: z.string().optional(),
  content: z.string().min(10, { message: "Testimonial must be at least 10 characters" }).max(1000, { message: "Testimonial cannot exceed 1000 characters" }),
  rating: z.number().min(1).max(5),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication - must be logged in
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to submit a testimonial" },
        { status: 401 }
      );
    }

    // Validate the request body
    const body = await request.json();
    const validationResult = testimonialSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid testimonial data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Extract validated data
    const { customerTitle, content, rating } = validationResult.data;

    // Create the testimonial with PENDING status
    const testimonial = await prisma.testimonial.create({
      data: {
        userId: session.user.id,
        customerTitle,
        content,
        rating,
        status: "PENDING", // Always starts as PENDING for user submissions
        isVisible: false, // Not visible until approved
      },
    });

    return NextResponse.json({
      success: true,
      message: "Testimonial submitted successfully and awaiting approval",
      testimonial: { id: testimonial.id },
    });
  } catch (error) {
    console.error("Error submitting testimonial:", error);
    return NextResponse.json(
      { error: "Failed to submit testimonial" },
      { status: 500 }
    );
  }
}
