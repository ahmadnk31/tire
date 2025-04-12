import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const subscriberId = params.id;
    const body = await req.json();
    const { subscribed } = body;
    
    const subscriber = await prisma.subscriber.update({
      where: {
        id: subscriberId,
      },
      data: {
        subscribed,
        unsubscribedAt: subscribed ? null : new Date(),
        lastActive: new Date(),
      },
      include: {
        groups: true,
      },
    });
    
    return NextResponse.json(subscriber);
  } catch (error) {
    console.error("Error updating subscriber:", error);
    return NextResponse.json(
      { error: "Failed to update subscriber" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const subscriberId = params.id;
    
    await prisma.subscriber.delete({
      where: {
        id: subscriberId,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting subscriber:", error);
    return NextResponse.json(
      { error: "Failed to delete subscriber" },
      { status: 500 }
    );
  }
}
