

import { BrandsDataTable } from "./components/brands-data-table"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Brands | Dashboard",
  description: "Manage your brand catalog",
}

export default function BrandsPage() {
  return (
    <div className="flex flex-col gap-5 p-4">
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink>Brands</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      <div className="grid grid-cols-1">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Brand Management</h1>
          <p className="text-muted-foreground">
            Create, update, and delete brands in your catalog
          </p>
        </div>
        <BrandsDataTable />
      </div>
    </div>
  )
}