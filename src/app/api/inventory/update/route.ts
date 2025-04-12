import { NextRequest, NextResponse } from "next/server";
import { updateInventory } from "@/lib/inventory";

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
    }

    const body = await request.json();
    const validatedData = updateInventorySchema.parse(body);

    const updatedInventory = await updateInventory(
      validatedData.productId,
      validatedData.locationId,
      validatedData.quantityChange,
      validatedData.movementType,
      validatedData.orderId,
      validatedData.notes
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