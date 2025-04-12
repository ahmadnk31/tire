import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { z } from "zod";

// Schema for validating retailer profile updates
const retailerProfileSchema = z.object({
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters." }),
  phone: z.string().min(5, { message: "Phone number is required." }),
  businessAddress: z.string().min(5, { message: "Business address is required." }),
  taxId: z.string().optional(),
  yearsInBusiness: z.string().min(1, { message: "Years in business is required." }),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if user is a retailer
    if (session.user.role !== "RETAILER") {
      return NextResponse.json(
        { error: "Only retailers can access this endpoint" },
        { status: 403 }
      );
    }
    
    // Get retailer profile
    const retailerProfile = await prisma.retailerProfile.findUnique({
      where: { userId: session.user.id },
    });
    
    if (!retailerProfile) {
      return NextResponse.json(
        { error: "Retailer profile not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(retailerProfile);
  } catch (error) {
    console.error("Error fetching retailer profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch retailer profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if user is a retailer
    if (session.user.role !== "RETAILER") {
      return NextResponse.json(
        { error: "Only retailers can access this endpoint" },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    // Validate request data
    const result = retailerProfileSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { companyName, phone, businessAddress, taxId, yearsInBusiness } = result.data;
    
    // Check if the retailer profile exists
    const existingProfile = await prisma.retailerProfile.findUnique({
      where: { userId: session.user.id },
    });
    
    let updatedProfile;
    
    if (existingProfile) {
      // Update existing profile
      updatedProfile = await prisma.retailerProfile.update({
        where: { userId: session.user.id },
        data: {
          companyName,
          phone,
          businessAddress,
          taxId,
          yearsInBusiness,
        },
      });
    } else {
      // Create new profile (this shouldn't normally happen, but just in case)
      updatedProfile = await prisma.retailerProfile.create({
        data: {
          userId: session.user.id,
          companyName,
          phone,
          businessAddress,
          taxId,
          yearsInBusiness,
        },
      });
    }
    
    return NextResponse.json({
      message: "Retailer profile updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating retailer profile:", error);
    return NextResponse.json(
      { error: "Failed to update retailer profile" },
      { status: 500 }
    );
  }
}