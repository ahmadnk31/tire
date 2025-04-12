import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

// POST to toggle like/unlike a review
export async function POST(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { reviewId } = await params;

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Check if the user has already liked this review
    const existingLike = await prisma.reviewLike.findFirst({
      where: {
        reviewId,
        userId,
      },
    });

    if (existingLike) {
      // User has already liked this review, so unlike it
      await prisma.reviewLike.delete({
        where: {
          id: existingLike.id,
        },
      });

      // Decrement helpfulCount
      await prisma.review.update({
        where: { id: reviewId },
        data: {
          helpfulCount: {
            decrement: 1,
          },
        },
      });

      return NextResponse.json({
        liked: false,
        message: "Review unliked successfully",
      });
    } else {
      // User hasn't liked this review yet, so like it
      await prisma.reviewLike.create({
        data: {
          reviewId,
          userId,
        },
      });

      // Increment helpfulCount
      await prisma.review.update({
        where: { id: reviewId },
        data: {
          helpfulCount: {
            increment: 1,
          },
        },
      });

      return NextResponse.json({
        liked: true,
        message: "Review liked successfully",
      });
    }
  } catch (error) {
    console.error("Error toggling review like:", error);
    return NextResponse.json(
      { error: "Failed to process like action" },
      { status: 500 }
    );
  }
}

// GET to check if the current user has liked the review
export async function GET(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ liked: false });
    }

    const userId = session.user.id;
    const { reviewId } = await params;

    const existingLike = await prisma.reviewLike.findFirst({
      where: {
        reviewId,
        userId,
      },
    });

    return NextResponse.json({
      liked: !!existingLike,
    });
  } catch (error) {
    console.error("Error checking review like status:", error);
    return NextResponse.json(
      { error: "Failed to check like status" },
      { status: 500 }
    );
  }
}