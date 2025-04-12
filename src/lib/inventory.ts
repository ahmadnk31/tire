'use server'
import { PrismaClient, MovementType, LocationType } from "@prisma/client"

// Create a singleton instance of PrismaClient
const prisma = new PrismaClient()

// Get all locations
export async function getLocations() {
  try {
    return await prisma.location.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            inventory: true,
          },
        },
      },
    })
  } catch (error) {
    console.error("Failed to fetch locations:", error)
    throw new Error("Failed to fetch locations")
  }
}

// Get location by ID
export async function getLocationById(id: string) {
  try {
    return await prisma.location.findUnique({
      where: { id },
    })
  } catch (error) {
    console.error(`Failed to fetch location with ID ${id}:`, error)
    throw new Error("Failed to fetch location")
  }
}

// Create a new location
export async function createLocation(data: {
  name: string
  type: string
  address?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  isActive: boolean
}) {
  try {
    return await prisma.location.create({
      data: {
        name: data.name,
        type: data.type as LocationType, // Cast to LocationType
        address: data.address,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        isActive: data.isActive,
      },
    })
  } catch (error) {
    console.error("Failed to create location:", error)
    throw new Error("Failed to create location")
  }
}

// Update an existing location
export async function updateLocation(
  id: string,
  data: {
    name?: string
    type?: string
    address?: string | null
    city?: string | null
    state?: string | null
    postalCode?: string | null
    country?: string | null
    isActive?: boolean
  }
) {
  try {
    return await prisma.location.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type as LocationType, // Cast to LocationType
        address: data.address,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        isActive: data.isActive,
      },
    })
  } catch (error) {
    console.error(`Failed to update location with ID ${id}:`, error)
    throw new Error("Failed to update location")
  }
}

// Delete a location
export async function deleteLocation(id: string) {
  try {
    // First, check if there's any inventory in this location
    const inventoryCount = await prisma.inventory.count({
      where: { locationId: id },
    })

    if (inventoryCount > 0) {
      throw new Error("Cannot delete location with existing inventory")
    }

    return await prisma.location.delete({
      where: { id },
    })
  } catch (error) {
    console.error(`Failed to delete location with ID ${id}:`, error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to delete location")
  }
}

// Get inventory by location
export async function getInventoryByLocation(locationId: string) {
  try {
    return await prisma.inventory.findMany({
      where: { locationId },
      include: {
        product: {
          include: {
            brand: true,
            model: true,
            category: true,
          },
        },
      },
      orderBy: { product: { name: "asc" } },
    })
  } catch (error) {
    console.error(`Failed to fetch inventory for location ${locationId}:`, error)
    throw new Error("Failed to fetch inventory")
  }
}
export async function getAllProducts() {
  try {
    return await prisma.product.findMany({
      where: {
        isVisible: true,
        isDiscontinued: false,
      },
      include: {
        brand: true,
        model: true,
        category: true,
      },
      orderBy: { name: "asc" },
    })
  }
  catch (error) {
    console.error("Failed to fetch all products:", error)
    throw new Error("Failed to fetch all products")
  }
}
// Get products not yet in a specific location
export async function getAvailableProducts(locationId: string) {
  try {
    // Get IDs of products already in this location
    const existingProductIds = await prisma.inventory
      .findMany({
        where: { locationId },
        select: { productId: true },
      })
      .then((items: { productId: string }[]) => items.map((item: { productId: string }) => item.productId))

    // Find products not in this location
    return await prisma.product.findMany({
      where: {
        id: { notIn: existingProductIds.length > 0 ? existingProductIds : undefined },
        isVisible: true,
        isDiscontinued: false,
      },
      include: {
        brand: true,
        model: true,
        category: true,
      },
      orderBy: { name: "asc" },
    })
  } catch (error) {
    console.error(`Failed to fetch available products for location ${locationId}:`, error)
    throw new Error("Failed to fetch available products")
  }
}

// Add a product to inventory
export async function addProductToInventory(data: {
  locationId: string
  productId: string
  quantity: number
  minimumLevel: number
  reorderLevel: number
  reorderQty: number
}) {
  try {
    // Check if this product is already in the inventory for this location
    const existing = await prisma.inventory.findUnique({
      where: {
        productId_locationId: {
          productId: data.productId,
          locationId: data.locationId,
        },
      },
    })

    if (existing) {
      throw new Error("This product is already in this inventory location")
    }

    // Create inventory entry
    const inventory = await prisma.inventory.create({
      data: {
        locationId: data.locationId,
        productId: data.productId,
        quantity: data.quantity,
        minimumLevel: data.minimumLevel,
        reorderLevel: data.reorderLevel,
        reorderQty: data.reorderQty,
      },
      include: {
        product: true,
        location: true,
      },
    })

    // Create inventory movement record if quantity > 0
    if (data.quantity > 0) {
      await prisma.inventoryMovement.create({
        data: {
          inventoryId: inventory.id,
          locationId: data.locationId,
          quantity: data.quantity,
          movementType: MovementType.PURCHASE,
          reason: "Initial inventory",
          notes: "Product added to inventory",
        },
      })
    }

    return inventory
  } catch (error) {
    console.error("Failed to add product to inventory:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to add product to inventory")
  }
}

// Update inventory quantity
export async function updateInventoryQuantity(
  inventoryId: string,
  change: number,
  movementType: MovementType = MovementType.ADJUSTMENT,
  reason = "Manual adjustment"
) {
  try {
    // Get current inventory
    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: { product: true },
    })

    if (!inventory) {
      throw new Error("Inventory item not found")
    }

    // Update quantity
    const updated = await prisma.inventory.update({
      where: { id: inventoryId },
      data: {
        quantity: { increment: change },
      },
      include: {
        product: true,
        location: true,
      },
    })

    // Create movement record
    await prisma.inventoryMovement.create({
      data: {
        inventoryId,
        locationId: inventory.locationId,
        quantity: change,
        movementType,
        reason,
        notes: `Quantity ${change >= 0 ? "increased" : "decreased"} by ${Math.abs(change)}`,
      },
    })

    return updated
  } catch (error) {
    console.error(`Failed to update inventory quantity for ID ${inventoryId}:`, error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to update inventory quantity")
  }
}

// Get inventory movement history for a specific inventory item
export async function getInventoryItemMovements(inventoryId: string) {
  try {
    return await prisma.inventoryMovement.findMany({
      where: { inventoryId },
      orderBy: { createdAt: "desc" },
      include: {
        inventory: {
          include: {
            product: true,
          },
        },
        location: true,
      },
    })
  } catch (error) {
    console.error(`Failed to fetch inventory movements for ID ${inventoryId}:`, error)
    throw new Error("Failed to fetch inventory movements")
  }
}

// Remove a product from inventory
export async function removeProductFromInventory(inventoryId: string) {
  try {
    // Get inventory info first for the movement record
    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: { product: true },
    })

    if (!inventory) {
      throw new Error("Inventory item not found")
    }

    // Create movement record if there was stock
    if (inventory.quantity > 0) {
      await prisma.inventoryMovement.create({
        data: {
          inventoryId,
          locationId: inventory.locationId,
          quantity: -inventory.quantity, // negative as we're removing
          movementType: MovementType.OTHER,
          reason: "Product removed from inventory",
          notes: `Removed ${inventory.product.name} with quantity ${inventory.quantity}`,
        },
      })
    }

    // Delete the inventory record
    return await prisma.inventory.delete({
      where: { id: inventoryId },
    })
  } catch (error) {
    console.error(`Failed to remove product from inventory ID ${inventoryId}:`, error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to remove product from inventory")
  }
}

// Get low stock products across all locations or for a specific location
export async function getLowStockProducts(locationId?: string) {
  try {
    return await prisma.inventory.findMany({
      where: {
        locationId: locationId,
        quantity: {
          lte: prisma.inventory.fields.minimumLevel,
        },
      },
      include: {
        product: {
          include: {
            brand: true,
            model: true,
            category: true,
          },
        },
        location: true,
      },
      orderBy: [
        {
          location: {
            name: "asc",
          },
        },
        {
          product: {
            name: "asc",
          },
        },
      ],
    })
  } catch (error) {
    console.error("Failed to fetch low stock products:", error)
    throw new Error("Failed to fetch low stock products")
  }
}

/**
 * Get inventory for a specific product across all locations
 */
export async function getProductInventory(productId: string) {
  return prisma.inventory.findMany({
    where: {
      productId,
    },
    include: {
      location: true,
    },
  });
}

/**
 * Get total stock for a product across all locations
 * 
 * For simplicity during early development, this currently returns the product's stock field.
 * Later, it can be switched to use the full inventory system.
 */
export async function getTotalProductStock(productId: string) {
  // Get the product's stock field
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stock: true }
  });
  
  return product ? product.stock : 0;
  
  // Full inventory implementation for later use:
  // const inventoryItems = await prisma.inventory.findMany({
  //   where: {
  //     productId,
  //   },
  //   select: {
  //     quantity: true,
  //   },
  // });
  // 
  // return inventoryItems.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Update inventory settings (minimum level, reorder level, reorder quantity)
 */
export async function updateInventorySettings(
  inventoryId: string,
  settings: {
    minimumLevel?: number
    reorderLevel?: number
    reorderQty?: number
  }
) {
  try {
    return await prisma.inventory.update({
      where: { id: inventoryId },
      data: {
        minimumLevel: settings.minimumLevel,
        reorderLevel: settings.reorderLevel,
        reorderQty: settings.reorderQty,
      },
      include: {
        product: true,
        location: true,
      },
    })
  } catch (error) {
    console.error(`Failed to update inventory settings for ID ${inventoryId}:`, error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to update inventory settings")
  }
}

