import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const subscriberGroups = await prisma.subscriberGroup.findMany({
      include: {
        _count: {
          select: { subscribers: true },
        },
      },
    });
    
    return NextResponse.json(subscriberGroups);
  } catch (error) {
    console.error("Error fetching subscriber groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriber groups" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description } = body;
    
    const subscriberGroup = await prisma.subscriberGroup.create({
      data: {
        name,
        description,
      },
    });
    
    return NextResponse.json(subscriberGroup);
  } catch (error) {
    console.error("Error creating subscriber group:", error);
    return NextResponse.json(
      { error: "Failed to create subscriber group" },
      { status: 500 }
    );
  }
}
