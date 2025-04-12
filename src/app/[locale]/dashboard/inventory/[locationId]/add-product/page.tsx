import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getLocationById, getAvailableProducts, getAllProducts } from "@/lib/inventory"
import { AddProductToInventoryForm } from "@/components/inventory/add-product-form"

interface AddProductPageProps {
  params: {
    locationId: string
  }
}

export async function generateMetadata({ params }: AddProductPageProps): Promise<Metadata> {
  const location = await getLocationById(params.locationId)
  
  if (!location) {
    return {
      title: "Location Not Found",
    }
  }
  
  return {
    title: `Add Product to ${location.name}`,
    description: `Add a product to ${location.name} inventory`,
  }
}

export default async function AddProductPage({ params }: AddProductPageProps) {
  const location = await getLocationById(params.locationId)
  
  if (!location) {
    notFound()
  }
  
  // Get products not yet in this inventory
  const availableProducts = await getAvailableProducts(params.locationId)
  const getAallProducts=await (await getAllProducts()).map((product) => {
    return {
     ...product,
    }
  })
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        Add Product to {location.name}
      </h1>
      
      <div className="max-w-3xl mx-auto">
        <AddProductToInventoryForm 
          locationId={params.locationId} 
          availableProducts={getAallProducts}
        />
      </div>
    </div>
  )
}