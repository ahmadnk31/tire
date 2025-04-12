import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

import { getLocationById, getInventoryByLocation } from "@/lib/inventory"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, CircleAlert, Clock, Package, PackageCheck, PackageMinus, PackageX, Truck } from "lucide-react"
import { AdjustInventoryForm } from "@/components/inventory/adjust-inventory-form"
import { InventoryHistoryTable } from "@/components/inventory/inventory-history-table"

interface ProductInventoryPageProps {
  params: {
    locationId: string
    productId: string
  }
}

export async function generateMetadata({ params }: ProductInventoryPageProps): Promise<Metadata> {
  const location = await getLocationById(params.locationId)
  
  if (!location) {
    return {
      title: "Location Not Found",
    }
  }
  
  // Find the inventory item for this product in this location
  const inventory = await getInventoryByLocation(params.locationId)
  const inventoryItem = inventory.find(item => item.productId === params.productId)
  
  if (!inventoryItem) {
    return {
      title: "Product Not Found in Inventory",
    }
  }
  
  return {
    title: `${inventoryItem.product.name} | ${location.name} Inventory`,
    description: `Manage inventory for ${inventoryItem.product.name} at ${location.name}`,
  }
}

export default async function ProductInventoryPage({ params }: ProductInventoryPageProps) {
  const location = await getLocationById(params.locationId)
  
  if (!location) {
    notFound()
  }
  
  // Find the inventory item for this product in this location
  const inventory = await getInventoryByLocation(params.locationId)
  const inventoryItem = inventory.find(item => item.productId === params.productId)
  
  if (!inventoryItem) {
    notFound()
  }
  
  const { product } = inventoryItem
  
  // Calculate inventory status
  const isLowStock = inventoryItem.quantity <= inventoryItem.minimumLevel && inventoryItem.quantity > 0
  const isOutOfStock = inventoryItem.quantity === 0
  const shouldReorder = inventoryItem.quantity <= inventoryItem.reorderLevel
  
  return (
    <div className="container mx-auto py-6">
      {/* Breadcrumb and back button */}
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/inventory/${params.locationId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {location.name} Inventory
          </Link>
        </Button>
      </div>
      
      {/* Product header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="w-full md:w-1/3 lg:w-1/4">
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
              <p className="text-muted-foreground mt-1">SKU: {product.sku || "N/A"}</p>
            </div>
            
            <div>
              {isOutOfStock ? (
                <Badge variant="destructive" className="text-base px-3 py-1">
                  <PackageX className="mr-1 h-4 w-4" />
                  Out of Stock
                </Badge>
              ) : isLowStock ? (
                <Badge variant="destructive" className="bg-amber-500 text-base px-3 py-1">
                  <PackageMinus className="mr-1 h-4 w-4" />
                  Low Stock
                </Badge>
              ) : (
                <Badge variant="default" className="bg-green-500 text-base px-3 py-1">
                  <PackageCheck className="mr-1 h-4 w-4" />
                  In Stock
                </Badge>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Current Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{inventoryItem.quantity}</div>
                <p className="text-muted-foreground text-sm">
                  Last updated: {new Date(inventoryItem.lastUpdated).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Stock Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Minimum Level:</span>
                    <span className="font-medium">{inventoryItem.minimumLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reorder Level:</span>
                    <span className="font-medium">{inventoryItem.reorderLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reorder Quantity:</span>
                    <span className="font-medium">{inventoryItem.reorderQty}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Product Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Brand</p>
                    <p className="font-medium">{product.brand.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Model</p>
                    <p className="font-medium">{product.model.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Category</p>
                    <p className="font-medium">{product.category.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Size</p>
                    <p className="font-medium">
                      {product.width}/{product.aspectRatio}R{product.rimDiameter}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Speed Rating</p>
                    <p className="font-medium">{product.speedRating}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Load Index</p>
                    <p className="font-medium">{product.loadIndex}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Inventory management section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Inventory History</CardTitle>
              <CardDescription>
                Recent inventory movements for this product at {location.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryHistoryTable inventoryId={inventoryItem.id} />
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Adjust Inventory</CardTitle>
              <CardDescription>
                Update quantity and stock settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdjustInventoryForm 
                inventoryItem={inventoryItem} 
                locationId={params.locationId} 
              />
            </CardContent>
          </Card>
          
          {shouldReorder && (
            <Card className="mt-4 border-amber-500">
              <CardHeader className="bg-amber-500/10 pb-2 border-b border-amber-500/20">
                <div className="flex items-center">
                  <CircleAlert className="h-5 w-5 text-amber-500 mr-2" />
                  <CardTitle className="text-lg">Reorder Recommendation</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm">
                  Current stock ({inventoryItem.quantity}) is below the reorder level ({inventoryItem.reorderLevel}).
                  Consider ordering {inventoryItem.reorderQty} more units.
                </p>
                <div className="mt-4">
                  <Button className="w-full" asChild>
                    <Link href={`/dashboard/orders/new?productId=${product.id}&quantity=${inventoryItem.reorderQty}`}>
                      <Truck className="mr-2 h-4 w-4" />
                      Create Purchase Order
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}