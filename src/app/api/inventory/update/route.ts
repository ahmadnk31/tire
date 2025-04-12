import { NextRequest, NextResponse } from "next/server";
import { updateInventory } from "@/lib/inventory";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

const updateInventorySchema = z.object({
  productId: z.string(),
  locationId: z.string(),
  quantityChange: z.number(),
  movementType: z.object({
    name: z.string(),
    description: z.string().optional(),
  }),
  orderId: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for admin or manager permissions here
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }    const body = await request.json();
    const validatedData = updateInventorySchema.parse(body);
    
    // First, find the inventory ID using productId and locationId
    const inventory = await prisma.inventory.findUnique({
      where: {
        productId_locationId: {
          productId: validatedData.productId,
          locationId: validatedData.locationId
        }
      }
    });
    
    if (!inventory) {
      return NextResponse.json({ error: "Inventory not found" }, { status: 404 });
    }

    const updatedInventory = await updateInventory(
      inventory.id,
      {
        quantity: inventory.quantity + validatedData.quantityChange, // Add the change to current quantity
        minimumLevel: inventory.minimumLevel, // Preserve existing values
        reorderLevel: inventory.reorderLevel, // Preserve existing values
        reorderQty: inventory.reorderQty, // Preserve existing values
      }
    );

    return NextResponse.json({ success: true, data: updatedInventory });
  } catch (error) {
    console.error("Error updating inventory:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update inventory" },
      { status: 500 }
    );
  }
}