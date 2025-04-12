"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { MovementType } from "@prisma/client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Search, 
  ArrowUpDown, 
  MoreHorizontal, 
  Edit, 
  History, 
  ArrowRight,
  Loader2,
  PlusCircle,
  MinusCircle,
  Trash2
} from "lucide-react"
import { updateInventoryQuantity } from "@/lib/inventory"
import { toast } from "sonner"

// This interface represents the inventory data with product details
interface InventoryItem {
  id: string
  productId: string
  quantity: number
  minimumLevel: number
  reorderLevel: number
  reorderQty: number
  lastUpdated: Date
  product: {
    id: string
    name: string
    sku: string | null
    brand: {
      name: string
    }
    category: {
      name: string
    }
    model: {
      name: string
    }
    width: number
    aspectRatio: number
    rimDiameter: number
    speedRating: string
    images: string[]
    // Add other product fields as needed
  }
}

interface InventoryProductsTableProps {
  inventory: InventoryItem[]
  locationId: string
}

export function InventoryProductsTable({ inventory, locationId }: InventoryProductsTableProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [displayLimit, setDisplayLimit] = useState(20) // Initial display limit

  // Filter inventory based on search query
  const filteredInventory = inventory.filter((item) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      item.product.name.toLowerCase().includes(searchLower) ||
      item.product.sku?.toLowerCase().includes(searchLower) ||
      item.product.brand.name.toLowerCase().includes(searchLower) ||
      item.product.category.name.toLowerCase().includes(searchLower) ||
      `${item.product.width}/${item.product.aspectRatio}R${item.product.rimDiameter}`.includes(searchLower)
    )
  })

  // Limit the displayed items
  const displayedInventory = filteredInventory.slice(0, displayLimit)

  // Check if there are more items to display
  const hasMore = displayedInventory.length < filteredInventory.length

  // Function to load more items
  const loadMore = () => {
    setDisplayLimit(prev => prev + 20) // Increase the display limit by 20
  }

  // Real implementation to update inventory quantity
  const updateQuantity = async (inventoryId: string, change: number) => {
    setIsUpdating(inventoryId)
    
    try {
      // Call the actual API function
      await updateInventoryQuantity(
        inventoryId, 
        change, 
        MovementType.ADJUSTMENT, 
        "Quick adjustment from inventory list"
      )
      
      // Show success toast
      toast.success(`Quantity ${change > 0 ? "increased" : "decreased"} by ${Math.abs(change)}`)
      
      // Refresh the page data
      router.refresh()
    } catch (error) {
      console.error("Failed to update quantity:", error)
      
      // Show error toast
      toast.error("Failed to update quantity. Please try again.")
    } finally {
      setIsUpdating(null)
    }
  }
  
  // Function to remove product from inventory
  const removeFromInventory = async (inventoryId: string, productName: string) => {
    if (!confirm(`Are you sure you want to remove "${productName}" from this location's inventory?`)) {
      return
    }
    
    setIsUpdating(inventoryId)
    
    try {
      // Call API to remove product from inventory
      const response = await fetch(`/api/inventory/product/${inventoryId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove product from inventory');
      }
      
      // Show success toast
      toast.success(`${productName} removed from inventory`)
      
      // Refresh the page data
      router.refresh()
    } catch (error) {
      console.error("Failed to remove product:", error)
      
      // Show error toast
      toast.error("Failed to remove product. Please try again.")
    } finally {
      setIsUpdating(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Product</TableHead>
              <TableHead>Size & Speed</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead className="text-center">Quantity</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              displayedInventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-muted relative overflow-hidden">
                        {item.product.images && item.product.images.length > 0 ? (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                            No img
                          </div>
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/dashboard/products/${item.product.id}`}
                          className="font-medium hover:underline"
                        >
                          {item.product.name}
                        </Link>
                        <div className="text-sm text-muted-foreground">
                          {item.product.sku || "No SKU"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.product.width}/{item.product.aspectRatio}R{item.product.rimDiameter} {item.product.speedRating}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{item.product.brand.name}</span>
                      <span className="text-sm text-muted-foreground">{item.product.model.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={isUpdating === item.id}
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                      <span className="w-10 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={isUpdating === item.id}
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        {isUpdating === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <PlusCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {item.quantity === 0 ? (
                      <Badge variant="destructive">Out of Stock</Badge>
                    ) : item.quantity <= item.minimumLevel ? (
                      <Badge variant="destructive" className="bg-amber-500">Low Stock</Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-500">In Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/inventory/${locationId}/products/${item.productId}`)}>
                          <ArrowRight className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/inventory/${locationId}/products/${item.productId}/adjust`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Adjust Inventory
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/inventory/${locationId}/products/${item.productId}/history`)}>
                          <History className="mr-2 h-4 w-4" />
                          View History
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => removeFromInventory(item.id, item.product.name)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove Product
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* "Continue to iterate?" button */}
      {hasMore && (
        <div className="flex justify-center mt-4">
          <Button 
            variant="outline" 
            onClick={loadMore}
            className="flex items-center gap-2"
          >
            Continue to iterate? 
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}