import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import { authOptions } from "@/lib/auth/auth-options"

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Fetch all retailer requests
    const applications = await prisma.retailerRequest.findMany({
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(applications)
  } catch (error) {
    console.error("Error fetching retailer applications:", error)
    return NextResponse.json(
      { error: "Failed to fetch retailer applications" },
      { status: 500 }
    )
  }
}