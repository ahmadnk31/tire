import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"

import { getLocationById, getInventoryByLocation } from "@/lib/inventory"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CirclePlus, PackageSearch, AlertTriangle } from "lucide-react"
import { InventoryProductsTable } from "@/components/inventory/inventory-products-table"
import { InventoryStats } from "@/components/inventory/inventory-stats"

interface LocationPageProps {
  params: {
    locationId: string
  }
}

export async function generateMetadata({ params }: LocationPageProps): Promise<Metadata> {
  const location = await getLocationById(params.locationId)
  
  if (!location) {
    return {
      title: "Inventory Location Not Found",
    }
  }
  
  return {
    title: `${location.name} Inventory`,
    description: `Manage inventory for ${location.name}`,
  }
}

export default async function LocationInventoryPage({ params }: LocationPageProps) {
  const location = await getLocationById(params.locationId)
  
  if (!location) {
    notFound()
  }
  
  const inventory = await getInventoryByLocation(params.locationId)
  
  // Get counts for different inventory statuses
  const lowStockCount = inventory.filter(item => item.quantity <= item.minimumLevel).length
  const outOfStockCount = inventory.filter(item => item.quantity === 0).length
  const inStockCount = inventory.filter(item => item.quantity > 0).length
  
  return (
    <div className="container mx-auto py-6">
      {/* Header with location info and actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{location.name}</h1>
            <Badge variant={location.isActive ? "default" : "outline"}>
              {location.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {location.type} • {location.city}, {location.state} {location.postalCode}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/inventory/${location.id}/edit`}>
              Edit Location
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/inventory/${location.id}/add-product`}>
              <CirclePlus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Inventory stats */}
      <InventoryStats
        totalProducts={inventory.length}
        inStock={inStockCount}
        lowStock={lowStockCount}
        outOfStock={outOfStockCount}
      />
      
      {/* Inventory products */}
      <div className="mt-6">
        {inventory.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <PackageSearch className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Products in this Location</h3>
              <p className="text-muted-foreground text-center mt-2 mb-6 max-w-md">
                This inventory location doesn't have any products yet. Add products to start tracking inventory.
              </p>
              <Button asChild>
                <Link href={`/dashboard/inventory/${location.id}/add-product`}>
                  <CirclePlus className="mr-2 h-4 w-4" />
                  Add First Product
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="mt-6">
            <TabsList>
              <TabsTrigger value="all">All Products ({inventory.length})</TabsTrigger>
              <TabsTrigger value="in-stock">In Stock ({inStockCount})</TabsTrigger>
              <TabsTrigger value="low-stock">
                Low Stock ({lowStockCount})
                {lowStockCount > 0 && <AlertTriangle className="ml-1 h-4 w-4 text-amber-500" />}
              </TabsTrigger>
              <TabsTrigger value="out-of-stock">
                Out of Stock ({outOfStockCount})
                {outOfStockCount > 0 && <AlertTriangle className="ml-1 h-4 w-4 text-destructive" />}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              <InventoryProductsTable
                inventory={inventory}
                locationId={location.id}
              />
            </TabsContent>
            
            <TabsContent value="in-stock" className="mt-4">
              <InventoryProductsTable
                inventory={inventory.filter(item => item.quantity > 0)}
                locationId={location.id}
              />
            </TabsContent>
            
            <TabsContent value="low-stock" className="mt-4">
              <InventoryProductsTable
                inventory={inventory.filter(item => item.quantity <= item.minimumLevel && item.quantity > 0)}
                locationId={location.id}
              />
            </TabsContent>
            
            <TabsContent value="out-of-stock" className="mt-4">
              <InventoryProductsTable
                inventory={inventory.filter(item => item.quantity === 0)}
                locationId={location.id}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}