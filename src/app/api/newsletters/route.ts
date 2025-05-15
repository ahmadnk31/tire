import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NewsletterStatus } from "@prisma/client";
import { sendNewsletter } from "@/lib/email/newsletter-service";

export async function GET() {
  try {
    const newsletters = await prisma.newsletter.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        recipientGroups: true,
      },
    });
    
    return NextResponse.json(newsletters);
  } catch (error) {
    console.error("Error fetching newsletters:", error);
    return NextResponse.json(
      { error: "Failed to fetch newsletters" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, subject, content, schedule, recipientGroups, sendNow } = body;
    
    // Determine newsletter status
    const status = sendNow ? NewsletterStatus.SENDING : 
                   schedule ? NewsletterStatus.SCHEDULED : 
                   NewsletterStatus.DRAFT;
    
    // Create newsletter record
    const newsletter = await prisma.newsletter.create({
      data: {
        title,
        subject,
        content,
        scheduledFor: schedule || null,
        status,
        recipientGroups: {
          connect: recipientGroups.map((groupId: string) => ({
            id: groupId,
          })),
        },
      },
    });
    
    // If sendNow is true, send the newsletter immediately
    if (sendNow) {
      try {
        // This will be processed asynchronously to avoid blocking the response
        const sendPromise = sendNewsletter(newsletter.id);
        
        // Don't await the promise here to avoid blocking the API response
        // But add a catch handler to log any errors
        sendPromise.catch((error) => {
          console.error(`Error sending newsletter ${newsletter.id}:`, error);
        });
        
        console.log(`Newsletter ${newsletter.id} is being sent in the background`);
      } catch (error) {
        console.error(`Failed to initiate sending for newsletter ${newsletter.id}:`, error);
      }
    }
    
    return NextResponse.json(newsletter);
  } catch (error) {
    console.error("Error creating newsletter:", error);
    return NextResponse.json(
      { error: "Failed to create newsletter" },
      { status: 500 }
    );
  }
}
