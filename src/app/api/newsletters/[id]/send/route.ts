import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendNewsletter } from "@/lib/email/newsletter-service";
import { NewsletterStatus } from "@prisma/client";

export async function POST(
  req: Request, 
  { params }: { params: { id: string } }
) {
  try {
    const newsletterId = params.id;
    
    // Check if newsletter exists and is in the right state
    const newsletter = await prisma.newsletter.findUnique({
      where: { id: newsletterId },
    });
    
    if (!newsletter) {
      return NextResponse.json(
        { error: "Newsletter not found" },
        { status: 404 }
      );
    }
    
    // Only send newsletters that are in DRAFT or SCHEDULED status
    const allowedStatuses: NewsletterStatus[] = [NewsletterStatus.DRAFT, NewsletterStatus.SCHEDULED];
    if (!allowedStatuses.includes(newsletter.status)) {
      return NextResponse.json(
        { 
          error: "Newsletter cannot be sent", 
          message: `Newsletter is in ${newsletter.status} state` 
        },
        { status: 400 }
      );
    }
    
    // Send the newsletter
    const result = await sendNewsletter(newsletterId);
    
    return NextResponse.json({
      ...result,
    });
  } catch (error: any) {
    console.error("Error sending newsletter:", error);
    return NextResponse.json(
      { 
        error: "Failed to send newsletter",
        message: error.message
      },
      { status: 500 }
    );
  }
}
