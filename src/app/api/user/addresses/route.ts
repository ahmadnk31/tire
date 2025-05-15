import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { z } from "zod";

// Schema for validating address data
const addressSchema = z.object({
  addressType: z.enum(['SHIPPING', 'BILLING', 'BOTH']).default('SHIPPING'),
  isDefault: z.boolean().default(false),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  addressLine1: z.string().min(1, 'Address is required'),
  addressLine2: z.string().optional().nullable(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  countryCode: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  deliveryInstructions: z.string().optional().nullable(),
});

// GET - Fetch all addresses for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const addresses = await prisma.userAddress.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ],
    });
    
    return NextResponse.json(addresses);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 }
    );
  }
}

// POST - Create a new address for the current user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Validate request data
    const result = addressSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: result.error.format() },
        { status: 400 }
      );
    }
    
    const addressData = result.data;
    
    // If this address is being set as default, unset default flag on all other addresses of the same type
    if (addressData.isDefault) {
      await prisma.userAddress.updateMany({
        where: { 
          userId: session.user.id,
          addressType: addressData.addressType,
          isDefault: true
        },
        data: { isDefault: false }
      });
    }
    
    // Create the new address
    const newAddress = await prisma.userAddress.create({
      data: {
        ...addressData,
        userId: session.user.id
      }
    });
    
    return NextResponse.json(newAddress);
  } catch (error) {
    console.error("Error creating address:", error);
    return NextResponse.json(
      { error: "Failed to create address" },
      { status: 500 }
    );
  }
}
