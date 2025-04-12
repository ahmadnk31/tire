import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
    
    // Create newsletter record
    const newsletter = await prisma.newsletter.create({
      data: {
        title,
        subject,
        content,
        scheduledFor: schedule || null,
        status: sendNow ? "SENT" : schedule ? "SCHEDULED" : "DRAFT",
        recipientGroups: {
          connect: recipientGroups.map((groupId: string) => ({
            id: groupId,
          })),
        },
      },
    });
    
    // If sendNow is true, we would implement email sending logic here
    // For now, we'll just update the status
    if (sendNow) {
      // In a real application, this would trigger an email service
      console.log(`Newsletter ${newsletter.id} would be sent now`);
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
