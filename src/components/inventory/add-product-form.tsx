"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Check, ChevronsUpDown, Package, Search } from "lucide-react"
import { addProductToInventory } from "@/lib/inventory"

// Interface for the product data
interface Product {
  id: string
  name: string
  sku: string | null
  brand: {
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
}

interface AddProductToInventoryFormProps {
  locationId: string
  availableProducts: Product[]
}

const addProductSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().int().min(0, "Quantity must be 0 or greater"),
  minimumLevel: z.coerce.number().int().min(0, "Minimum level must be 0 or greater"),
  reorderLevel: z.coerce.number().int().min(0, "Reorder level must be 0 or greater"),
  reorderQty: z.coerce.number().int().min(0, "Reorder quantity must be 0 or greater"),
})

export function AddProductToInventoryForm({
  locationId,
  availableProducts,
}: AddProductToInventoryFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId)
    setOpen(false)
    
    const product = availableProducts.find(p => p.id === productId) || null
    setSelectedProduct(product)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    
    const formData = new FormData(event.currentTarget)
    
    // Validate form data
    try {
      const data = {
        productId: formData.get("productId") as string,
        quantity: Number(formData.get("quantity")),
        minimumLevel: Number(formData.get("minimumLevel")),
        reorderLevel: Number(formData.get("reorderLevel")),
        reorderQty: Number(formData.get("reorderQty")),
      }
      
      addProductSchema.parse(data)
      
      // Clear any errors if validation passed
      setFormErrors({})
      
      try {
        // Show loading state
        const loadingToast = toast.loading("Adding product to inventory...")
        
        // Call the server action to add product to inventory
        await addProductToInventory({
          locationId,
          ...data,
        })
        
        // Dismiss loading toast and show success
        toast.dismiss(loadingToast)
        toast.success("Product added to inventory successfully!")
        
        // Navigate back to the inventory page
        router.push(`/dashboard/inventory/${locationId}`)
        router.refresh()
      } catch (error) {
        console.error("Failed to add product:", error)
        toast.error("Failed to add product to inventory. Please try again.")
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path) {
            errors[err.path[0]] = err.message
          }
        })
        setFormErrors(errors)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="productId">Select Product *</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {selectedProductId
                    ? availableProducts.find((product) => product.id === selectedProductId)?.name
                    : "Select a product..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Search products..." className="h-9" />
                  <CommandEmpty>No product found.</CommandEmpty>
                  <CommandGroup className="max-h-[300px] overflow-auto">
                    {availableProducts.map((product) => (
                      <CommandItem
                        key={product.id}
                        value={product.id}
                        onSelect={() => handleProductSelect(product.id)}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="h-8 w-8 rounded bg-muted relative overflow-hidden flex-shrink-0">
                            {product.images && product.images.length > 0 ? (
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Package className="h-4 w-4 opacity-50" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col text-sm">
                            <span>{product.name}</span>
                            <span className="text-muted-foreground text-xs">
                              {product.brand.name} • {product.width}/{product.aspectRatio}R{product.rimDiameter}
                            </span>
                          </div>
                          <Check
                            className={`ml-auto h-4 w-4 ${
                              selectedProductId === product.id ? "opacity-100" : "opacity-0"
                            }`}
                          />
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            <input type="hidden" name="productId" value={selectedProductId} />
            {formErrors.productId && (
              <p className="text-sm text-destructive">{formErrors.productId}</p>
            )}
          </div>

          {selectedProduct && (
            <div className="pt-2 pb-4">
              <div className="bg-muted/40 rounded-lg p-4 flex items-start gap-4">
                <div className="h-16 w-16 rounded bg-muted relative overflow-hidden flex-shrink-0">
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    <Image
                      src={selectedProduct.images[0]}
                      alt={selectedProduct.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-6 w-6 opacity-50" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium">{selectedProduct.name}</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {selectedProduct.brand.name} • {selectedProduct.model.name}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {selectedProduct.width}/{selectedProduct.aspectRatio}R{selectedProduct.rimDiameter} {selectedProduct.speedRating}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    SKU: {selectedProduct.sku || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Separator />

          <div className="pt-4 grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                defaultValue="0"
                required
              />
              {formErrors.quantity && (
                <p className="text-sm text-destructive">{formErrors.quantity}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="minimumLevel">Minimum Level *</Label>
              <Input
                id="minimumLevel"
                name="minimumLevel"
                type="number"
                min="0"
                defaultValue="5"
                required
              />
              {formErrors.minimumLevel && (
                <p className="text-sm text-destructive">{formErrors.minimumLevel}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reorderLevel">Reorder Level *</Label>
              <Input
                id="reorderLevel"
                name="reorderLevel"
                type="number"
                min="0"
                defaultValue="10"
                required
              />
              {formErrors.reorderLevel && (
                <p className="text-sm text-destructive">{formErrors.reorderLevel}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reorderQty">Reorder Quantity *</Label>
              <Input
                id="reorderQty"
                name="reorderQty"
                type="number"
                min="0"
                defaultValue="20"
                required
              />
              {formErrors.reorderQty && (
                <p className="text-sm text-destructive">{formErrors.reorderQty}</p>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t px-6 py-4">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={!selectedProductId}>
            Add to Inventory
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}