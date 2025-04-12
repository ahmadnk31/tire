
import { ProductsDataTable } from "./components/products-data-table"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Products | Dashboard",
  description: "Manage your product inventory",
}

export default function ProductsPage() {
  return (
    <div className="flex flex-col gap-5 p-4">
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink>Products</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      <div className="grid grid-cols-1">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Product Management</h1>
          <p className="text-muted-foreground">
            Create, update, and delete products in your inventory
          </p>
        </div>
        <ProductsDataTable />
      </div>
    </div>
  )
}