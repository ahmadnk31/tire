import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

// GET a specific review by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const { reviewId } = await params;
    
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        images: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Check if logged-in user has liked this review
    const session = await getServerSession(authOptions);
    let hasLiked = false;

    if (session?.user) {
      const like = await prisma.reviewLike.findFirst({
        where: {
          reviewId,
          userId: session.user.id,
        },
      });
      hasLiked = !!like;
    }

    return NextResponse.json({
      ...review,
      hasLiked,
    });

  } catch (error) {
    console.error("Error fetching review:", error);
    return NextResponse.json(
      { error: "Failed to fetch review" },
      { status: 500 }
    );
  }
}

// UPDATE a review
export async function PATCH(
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

    const { reviewId } =await params;
    const data = await request.json();

    // Find the review to check ownership
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Only allow the user who created the review or an admin to update it
    if (existingReview.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You don't have permission to update this review" },
        { status: 403 }
      );
    }

    // Validate rating if provided
    if (data.rating && (data.rating < 1 || data.rating > 5)) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Update the review
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: data.rating,
        title: data.title,
        content: data.content,
        // Admin can update status
        ...(session.user.role === "ADMIN" && { status: data.status }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        images: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    // Handle image updates if provided
    if (data.images && Array.isArray(data.images)) {
      // Delete existing images if we're replacing them
      if (data.replaceImages) {
        await prisma.reviewImage.deleteMany({
          where: { reviewId },
        });
      }

      // Add new images
      if (data.images.length > 0) {
        const reviewImages = data.images.map((image: { url: string, caption?: string }) => ({
          reviewId,
          imageUrl: image.url,
          caption: image.caption || null,
        }));

        await prisma.reviewImage.createMany({
          data: reviewImages,
        });
      }

      // Reload review with updated images
      const reviewWithImages = await prisma.review.findUnique({
        where: { id: reviewId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          images: true,
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      return NextResponse.json(reviewWithImages);
    }

    return NextResponse.json(updatedReview);

  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

// DELETE a review
export async function DELETE(
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

    const { reviewId } = await params;

    // Find the review to check ownership
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Only allow the user who created the review or an admin to delete it
    if (existingReview.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You don't have permission to delete this review" },
        { status: 403 }
      );
    }

    // Delete the review (Prisma will cascade delete related images, likes, and comments)
    await prisma.review.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}