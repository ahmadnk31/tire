"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { MovementType } from "@prisma/client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { updateInventoryQuantity, updateInventorySettings } from "@/lib/inventory"
import { toast } from "sonner"

interface InventoryItem {
  id: string
  quantity: number
  minimumLevel: number
  reorderLevel: number
  reorderQty: number
  product: {
    name: string
  }
}

interface AdjustInventoryFormProps {
  inventoryItem: InventoryItem
  locationId: string
}

const adjustQuantitySchema = z.object({
  change: z.coerce.number().int(),
  movementType: z.string(),
  reason: z.string().optional(),
  notes: z.string().optional(),
})

const adjustSettingsSchema = z.object({
  minimumLevel: z.coerce.number().int().min(0, "Minimum level must be 0 or greater"),
  reorderLevel: z.coerce.number().int().min(0, "Reorder level must be 0 or greater"),
  reorderQty: z.coerce.number().int().min(1, "Reorder quantity must be at least 1"),
})

export function AdjustInventoryForm({
  inventoryItem,
  locationId,
}: AdjustInventoryFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quantityFormErrors, setQuantityFormErrors] = useState<Record<string, string>>({})
  const [settingsFormErrors, setSettingsFormErrors] = useState<Record<string, string>>({})
  
  async function handleQuantitySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    
    const formData = new FormData(event.currentTarget)
    
    // Validate form data
    try {
      const data = {
        change: Number(formData.get("change")),
        movementType: formData.get("movementType") as string,
        reason: formData.get("reason") as string || undefined,
        notes: formData.get("notes") as string || undefined,
      }
      
      adjustQuantitySchema.parse(data)
      
      // Clear any errors if validation passed
      setQuantityFormErrors({})
      
      // Call API to update quantity
      setIsSubmitting(true)
      
      try {
        // Show loading toast
        const loadingToast = toast.loading("Updating inventory quantity...")
        
        // Call the server action to update quantity
        await updateInventoryQuantity(
          inventoryItem.id,
          data.change,
          data.movementType as MovementType,
          data.reason || data.notes
        )
        
        // Dismiss loading toast and show success
        toast.dismiss(loadingToast)
        toast.success(
          `Inventory updated: ${data.change > 0 ? '+' : ''}${data.change} units of ${inventoryItem.product.name}`
        )
        
        // Reset the form
        event.currentTarget.reset()
        
        // Refresh the page data
        router.refresh()
      } catch (error) {
        console.error("Failed to update quantity:", error)
        toast.error(
          `Failed to update inventory quantity for ${inventoryItem.product.name}`
        )
      } finally {
        setIsSubmitting(false)
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path) {
            errors[err.path[0]] = err.message
          }
        })
        setQuantityFormErrors(errors)
      }
    }
  }
  
  async function handleSettingsSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    
    const formData = new FormData(event.currentTarget)
    
    // Validate form data
    try {
      const data = {
        minimumLevel: Number(formData.get("minimumLevel")),
        reorderLevel: Number(formData.get("reorderLevel")),
        reorderQty: Number(formData.get("reorderQty")),
      }
      
      adjustSettingsSchema.parse(data)
      
      // Clear any errors if validation passed
      setSettingsFormErrors({})
      
      // Call API to update settings
      setIsSubmitting(true)
      
      try {
        // Show loading toast
        const loadingToast = toast.loading("Updating inventory settings...")
        
        // Call the server action to update settings
        await updateInventorySettings(
          inventoryItem.id,
          data
        )
        
        // Dismiss loading toast and show success
        toast.dismiss(loadingToast)
        toast.success(
          `Inventory settings for ${inventoryItem.product.name} updated successfully!`
        )
        
        // Refresh the page data
        router.refresh()
      } catch (error) {
        console.error("Failed to update settings:", error)
        toast.error(
          `Failed to update inventory settings for ${inventoryItem.product.name}`
        )
      } finally {
        setIsSubmitting(false)
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path) {
            errors[err.path[0]] = err.message
          }
        })
        setSettingsFormErrors(errors)
      }
    }
  }
  
  return (
    <Tabs defaultValue="quantity">
      <TabsList className="w-full">
        <TabsTrigger value="quantity" className="flex-1">Quantity</TabsTrigger>
        <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
      </TabsList>
      
      <TabsContent value="quantity" className="pt-4">
        <form onSubmit={handleQuantitySubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="change">Quantity Change</Label>
              <Input
                id="change"
                name="change"
                type="number"
                placeholder="Enter amount to add/subtract"
                defaultValue="0"
              />
              {quantityFormErrors.change && (
                <p className="text-sm text-destructive">{quantityFormErrors.change}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Use positive numbers to add, negative to subtract
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="movementType">Movement Type</Label>
              <Select name="movementType" defaultValue="ADJUSTMENT">
                <SelectTrigger id="movementType">
                  <SelectValue placeholder="Select movement type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PURCHASE">Purchase</SelectItem>
                  <SelectItem value="SALE">Sale</SelectItem>
                  <SelectItem value="RETURN">Return</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                  <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                  <SelectItem value="DAMAGED">Damaged</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                name="reason"
                placeholder="Reason for adjustment"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Additional notes"
                rows={3}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Quantity"}
            </Button>
          </div>
        </form>
      </TabsContent>
      
      <TabsContent value="settings" className="pt-4">
        <form onSubmit={handleSettingsSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="minimumLevel">Minimum Level</Label>
              <Input
                id="minimumLevel"
                name="minimumLevel"
                type="number"
                min="0"
                defaultValue={inventoryItem.minimumLevel}
              />
              {settingsFormErrors.minimumLevel && (
                <p className="text-sm text-destructive">{settingsFormErrors.minimumLevel}</p>
              )}
              <p className="text-xs text-muted-foreground">
                When stock falls below this level, it's considered "low stock"
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reorderLevel">Reorder Level</Label>
              <Input
                id="reorderLevel"
                name="reorderLevel"
                type="number"
                min="0"
                defaultValue={inventoryItem.reorderLevel}
              />
              {settingsFormErrors.reorderLevel && (
                <p className="text-sm text-destructive">{settingsFormErrors.reorderLevel}</p>
              )}
              <p className="text-xs text-muted-foreground">
                When stock falls below this level, the system recommends reordering
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reorderQty">Reorder Quantity</Label>
              <Input
                id="reorderQty"
                name="reorderQty"
                type="number"
                min="1"
                defaultValue={inventoryItem.reorderQty}
              />
              {settingsFormErrors.reorderQty && (
                <p className="text-sm text-destructive">{settingsFormErrors.reorderQty}</p>
              )}
              <p className="text-xs text-muted-foreground">
                The suggested quantity to reorder when stock is low
              </p>
            </div>
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Settings"}
            </Button>
          </div>
        </form>
      </TabsContent>
    </Tabs>
  )
}