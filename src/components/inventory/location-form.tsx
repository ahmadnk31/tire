"use client"

import { useState } from "react"
import { LocationType } from "@prisma/client"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface LocationFormProps {
  location?: {
    id: string
    name: string
    type: string
    address?: string | null
    city?: string | null
    state?: string | null
    postalCode?: string | null
    country?: string | null
    isActive: boolean
  }
  action: (formData: FormData) => Promise<void>
}

const locationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["WAREHOUSE", "STORE", "SUPPLIER", "CUSTOMER", "OTHER"]),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  isActive: z.boolean().default(true),
})

export function LocationForm({ location, action }: LocationFormProps) {
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isActive, setIsActive] = useState(location?.isActive ?? true)
  const [locationType, setLocationType] = useState<LocationType>(
    (location?.type as LocationType) ?? LocationType.WAREHOUSE
  )
  
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    
    const formData = new FormData(event.currentTarget)
    
    // Add the isActive value
    if (isActive) {
      formData.set("isActive", "on")
    } else {
      formData.delete("isActive")
    }
    
    // Validate form data
    try {
      locationSchema.parse({
        name: formData.get("name"),
        type: formData.get("type"),
        address: formData.get("address"),
        city: formData.get("city"),
        state: formData.get("state"),
        postalCode: formData.get("postalCode"),
        country: formData.get("country"),
        isActive,
      })
      
      // Clear any errors if validation passed
      setFormErrors({})
      
      // Submit the form
      await action(formData)
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
          <div className="grid gap-2">
            <Label htmlFor="name">Location Name *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={location?.name}
              placeholder="Main Warehouse"
              required
            />
            {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="type">Location Type *</Label>
            <Select
              name="type"
              defaultValue={locationType}
              onValueChange={(value) => setLocationType(value as LocationType)}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select location type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WAREHOUSE">Warehouse</SelectItem>
                <SelectItem value="STORE">Store</SelectItem>
                <SelectItem value="SUPPLIER">Supplier</SelectItem>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            {formErrors.type && <p className="text-sm text-destructive">{formErrors.type}</p>}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              defaultValue={location?.address || ""}
              placeholder="123 Main St"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                defaultValue={location?.city || ""}
                placeholder="Los Angeles"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                name="state"
                defaultValue={location?.state || ""}
                placeholder="CA"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                name="postalCode"
                defaultValue={location?.postalCode || ""}
                placeholder="90001"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                name="country"
                defaultValue={location?.country || ""}
                placeholder="USA"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              name="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="isActive">Active Location</Label>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t px-6 py-4">
          <Button variant="outline" type="button" onClick={() => history.back()}>
            Cancel
          </Button>
          <Button type="submit">
            {location ? "Update Location" : "Create Location"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}