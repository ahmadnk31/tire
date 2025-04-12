import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const subscribers = await prisma.subscriber.findMany({
      include: {
        groups: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return NextResponse.json(subscribers);
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscribers" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, groups } = body;
    
    const subscriber = await prisma.subscriber.create({
      data: {
        email,
        name,
        subscribed: true,
        lastActive: new Date(),
        groups: {
          connect: groups.map((groupId: string) => ({
            id: groupId,
          })),
        },
      },
      include: {
        groups: true,
      },
    });
    
    return NextResponse.json(subscriber);
  } catch (error) {
    console.error("Error creating subscriber:", error);
    return NextResponse.json(
      { error: "Failed to create subscriber" },
      { status: 500 }
    );
  }
}
