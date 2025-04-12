import { NextRequest, NextResponse } from "next/server";
import { getProductInventory, getTotalProductStock } from "@/lib/inventory";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import {prisma} from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession (authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const productId = params.productId;
    const inventory = await getProductInventory(productId);
    const totalStock = await getTotalProductStock(productId);

    return NextResponse.json({ inventory, totalStock });
  } catch (error) {
    console.error("Error fetching product inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inventoryId = params.productId;

    // Get the inventory record first to log details
    const inventoryRecord = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: {
        product: {
          select: {
            name: true,
          },
        },
        location: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!inventoryRecord) {
      return NextResponse.json(
        { error: "Inventory record not found" },
        { status: 404 }
      );
    }

    // Create an inventory removal audit record
    await prisma.inventoryHistory.create({
      data: {
        productId: inventoryRecord.productId,
        locationId: inventoryRecord.locationId,
        movementType: "EXPIRED",
        inventoryId: inventoryRecord.id,
        quantity: -inventoryRecord.quantity,
        performedAt: new Date(),
        notes: `Product ${inventoryRecord.product.name} expired at ${inventoryRecord.location.name}`,
        performedBy: session.user.email ?? "system",
      },
    });

    // Delete the inventory record
    await prisma.inventory.delete({
      where: { id: inventoryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing product from inventory:", error);
    return NextResponse.json(
      { error: "Failed to remove product from inventory" },
      { status: 500 }
    );
  }
}