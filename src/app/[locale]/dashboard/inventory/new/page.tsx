import { Metadata } from "next"
import { redirect } from "next/navigation"

import { createLocation } from "@/lib/inventory"
import { LocationForm } from "@/components/inventory/location-form"

export const metadata: Metadata = {
  title: "Create Inventory Location",
  description: "Add a new inventory location to the system",
}

export default function NewLocationPage() {
  async function handleCreateLocation(formData: FormData) {
    "use server"
    
    const name = formData.get("name") as string
    const type = formData.get("type") as string
    const address = formData.get("address") as string
    const city = formData.get("city") as string
    const state = formData.get("state") as string
    const postalCode = formData.get("postalCode") as string
    const country = formData.get("country") as string
    const isActive = formData.get("isActive") === "on"
    
    // Create the location
    const location = await createLocation({
      name,
      type,
      address,
      city,
      state,
      postalCode,
      country,
      isActive,
    })
    
    // Redirect to the new location's inventory page
    redirect(`/dashboard/inventory/${location.id}`)
  }
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Create Inventory Location</h1>
      
      <div className="max-w-2xl mx-auto">
        <LocationForm action={handleCreateLocation} />
      </div>
    </div>
  )
}