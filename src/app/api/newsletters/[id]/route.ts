import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendNewsletter } from "@/lib/email/newsletter-service";

export async function GET(
  req: Request, 
  { params }: { params: { id: string } }
) {
  try {
    const newsletterId = params.id;
    const newsletter = await prisma.newsletter.findUnique({
      where: {
        id: newsletterId,
      },
      include: {
        recipientGroups: true,
      },
    });
    
    if (!newsletter) {
      return NextResponse.json(
        { error: "Newsletter not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(newsletter);
  } catch (error) {
    console.error("Error fetching newsletter:", error);
    return NextResponse.json(
      { error: "Failed to fetch newsletter" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request, 
  { params }: { params: { id: string } }
) {
  try {
    const newsletterId = params.id;
    await prisma.newsletter.delete({
      where: {
        id: newsletterId,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting newsletter:", error);
    return NextResponse.json(
      { error: "Failed to delete newsletter" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request, 
  { params }: { params: { id: string } }
) {
  try {
    const newsletterId = params.id;
    const body = await req.json();
    
    const newsletter = await prisma.newsletter.update({
      where: {
        id: newsletterId,
      },
      data: body,
      include: {
        recipientGroups: true,
      },
    });
    
    return NextResponse.json(newsletter);
  } catch (error) {
    console.error("Error updating newsletter:", error);
    return NextResponse.json(
      { error: "Failed to update newsletter" },
      { status: 500 }
    );
  }
}
