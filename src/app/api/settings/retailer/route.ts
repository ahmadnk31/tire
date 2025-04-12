import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if user is a retailer
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        retailerProfile: true,
      },
    });
    
    if (!user || user.role !== "RETAILER") {
      return NextResponse.json(
        { error: "Only retailers can update retailer profiles" },
        { status: 403 }
      );
    }
    
    const { companyName, phone, businessAddress, taxId, yearsInBusiness } = await req.json();
    
    // Update or create retailer profile
    let retailerProfile;
    
    if (user.retailerProfile) {
      // Update existing profile
      retailerProfile = await prisma.retailerProfile.update({
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
      // Create new profile
      retailerProfile = await prisma.retailerProfile.create({
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
      retailerProfile,
      message: "Retailer profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating retailer profile:", error);
    return NextResponse.json(
      { error: "Failed to update retailer profile" },
      { status: 500 }
    );
  }
}