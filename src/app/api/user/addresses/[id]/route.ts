import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { z } from "zod";

// Schema for validating address updates
const addressUpdateSchema = z.object({
  addressType: z.enum(['SHIPPING', 'BILLING', 'BOTH']).optional(),
  isDefault: z.boolean().optional(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  addressLine1: z.string().min(1, 'Address is required').optional(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().min(1, 'City is required').optional(),
  state: z.string().min(1, 'State is required').optional(),
  postalCode: z.string().min(1, 'Postal code is required').optional(),
  country: z.string().min(1, 'Country is required').optional(),
  countryCode: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  deliveryInstructions: z.string().optional().nullable(),
});

// GET - Fetch a specific address
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: "Address ID is required" },
        { status: 400 }
      );
    }
    
    // Fetch the address, ensuring it belongs to the current user
    const address = await prisma.userAddress.findFirst({
      where: {
        id,
        userId: session.user.id
      },
    });
    
    if (!address) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(address);
  } catch (error) {
    console.error("Error fetching address:", error);
    return NextResponse.json(
      { error: "Failed to fetch address" },
      { status: 500 }
    );
  }
}

// PATCH - Update a specific address
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: "Address ID is required" },
        { status: 400 }
      );
    }
    
    // Verify the address exists and belongs to the current user
    const existingAddress = await prisma.userAddress.findFirst({
      where: {
        id,
        userId: session.user.id
      },
    });
    
    if (!existingAddress) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    
    // Validate request data
    const result = addressUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: result.error.format() },
        { status: 400 }
      );
    }
    
    const updatedData = result.data;
    
    // If this address is being set as default, unset default flag on all other addresses of the same type
    if (updatedData.isDefault) {
      await prisma.userAddress.updateMany({
        where: { 
          userId: session.user.id,
          addressType: updatedData.addressType || existingAddress.addressType,
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      });
    }
    
    // Update the address
    const updatedAddress = await prisma.userAddress.update({
      where: { id },
      data: updatedData,
    });
    
    return NextResponse.json(updatedAddress);
  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a specific address
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: "Address ID is required" },
        { status: 400 }
      );
    }
    
    // Verify the address exists and belongs to the current user
    const existingAddress = await prisma.userAddress.findFirst({
      where: {
        id,
        userId: session.user.id
      },
    });
    
    if (!existingAddress) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }
    
    // Check if the address is in use by any payment methods or orders
    const usageCount = await prisma.paymentMethod.count({
      where: { billingAddressId: id }
    });
    
    const orderUsageCount = await prisma.order.count({
      where: {
        OR: [
          { shippingAddressId: id },
          { billingAddressId: id }
        ]
      }
    });
    
    if (usageCount > 0 || orderUsageCount > 0) {
      return NextResponse.json(
        { error: "This address cannot be deleted because it is in use" },
        { status: 400 }
      );
    }
    
    // Delete the address
    await prisma.userAddress.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 }
    );
  }
}
