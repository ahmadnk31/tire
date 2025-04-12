import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

// GET comments for a specific review with pagination
export async function GET(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const { reviewId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Check if review exists
    const reviewExists = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true },
    });

    if (!reviewExists) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Fetch comments with pagination
    const [comments, totalCount] = await Promise.all([
      prisma.reviewComment.findMany({
        where: { reviewId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      }),
      prisma.reviewComment.count({ where: { reviewId } }),
    ]);

    return NextResponse.json({
      comments,
      meta: {
        currentPage: page,
        pageSize: limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching review comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST a new comment to the review
export async function POST(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to comment" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { reviewId } = await params;
    const data = await request.json();
    
    // Validate required content field
    const { content } = data;
    if (!content || content.trim() === "") {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Create the comment
    const comment = await prisma.reviewComment.create({
      data: {
        reviewId,
        userId,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating review comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}