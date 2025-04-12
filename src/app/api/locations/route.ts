import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export async function GET() {
  try {
    const locations = await prisma.location.findMany();
    return NextResponse.json(locations, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 });
  }
}