import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { processScheduledNewsletters } from "@/lib/email/newsletter-scheduler";

// This endpoint can be called by a cron job service like Vercel Cron
// to process scheduled newsletters
export async function POST() {
  try {
    // Attempt to get the session to check if the user is authenticated
    const session = await getServerSession(authOptions);

    // Check if it's an authenticated request from admin or an internal cron trigger
    // For cron jobs with a secret key, you would validate that here
    const isInternalRequest = 
      process.env.NODE_ENV === "development" || 
      // Check for a valid cron job secret in production
      (process.env.NODE_ENV === "production" && 
        process.env.CRON_SECRET && 
        process.env.CRON_SECRET === process.env.INTERNAL_CRON_SECRET);

    // Require authentication for this endpoint
    if (!session?.user?.email && !isInternalRequest) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // If authenticated but not admin, reject
    if (session?.user && session.user.role !== "ADMIN" && !isInternalRequest) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Process scheduled newsletters
    const result = await processScheduledNewsletters();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Error in newsletter scheduler API:", error);
    return NextResponse.json(
      {
        error: "Failed to process scheduled newsletters",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// Also handle GET requests for easier testing in development
export async function GET() {
  // Only allow GET requests in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Method not allowed" },
      { status: 405 }
    );
  }
  return await POST();
}
