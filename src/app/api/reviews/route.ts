import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

// GET reviews with pagination and filtering options
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("productId");
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const rating = searchParams.get("rating") ? parseInt(searchParams.get("rating")!) : undefined;
    const withImages = searchParams.get("withImages") === "true";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order") || "desc";
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;
    
    // Build filter object
    const where: any = {
      status: "PUBLISHED", // Only fetch published reviews
    };
    
    if (productId) {
      where.productId = productId;
    }
    
    if (userId) {
      where.userId = userId;
    }
    
    if (rating) {
      where.rating = rating;
    }
    
    if (withImages) {
      where.images = {
        some: {}, // Only reviews with at least one image
      };
    }

    // Build order object
    const orderBy: any = {};
    orderBy[sortBy] = order;
    
    // Fetch reviews with counts
    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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
      }),
      prisma.review.count({ where }),
    ]);

    // Get the session to determine if the user has liked any of these reviews
    const session = await getServerSession(authOptions);
    let userLikes: any[] = [];

    if (session?.user) {
      userLikes = await prisma.reviewLike.findMany({
        where: {
          userId: session.user.id,
          reviewId: {
            in: reviews.map(review => review.id),
          },
        },
        select: {
          reviewId: true,
        },
      });
    }

    // Add hasLiked property to each review
    const reviewsWithLikeInfo = reviews.map(review => ({
      ...review,
      hasLiked: userLikes.some(like => like.reviewId === review.id),
    }));
    
    return NextResponse.json({
      reviews: reviewsWithLikeInfo,
      meta: {
        currentPage: page,
        pageSize: limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
      },
    });
    
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST a new review (authenticated users only)
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to submit a review" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const data = await request.json();
    
    // Validate required fields
    const { productId, rating, content } = data;

    if (!productId || !rating || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Validate rating is between 1-5
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }
    
    // Check if user has purchased this product for verified status
    const hasOrdered = await prisma.orderItem.findFirst({
      where: {
        productId: productId,
        order: {
          userId: userId,
          status: { in: ["DELIVERED","SHIPPED"] },
        },
      },
    });

    // Create the review
    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        title: data.title,
        content,
        verified: !!hasOrdered,
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
    
    // Process images if any
    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      const reviewImages = data.images.map((image: { url: string, caption?: string }) => ({
        reviewId: review.id,
        imageUrl: image.url,
        caption: image.caption || null,
      }));
      
      await prisma.reviewImage.createMany({
        data: reviewImages,
      });
      
      // Reload review with images
      const updatedReview = await prisma.review.findUnique({
        where: { id: review.id },
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
      
      return NextResponse.json(updatedReview, { status: 201 });
    }
    
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}