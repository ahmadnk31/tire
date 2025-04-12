
import { CategoriesDataTable } from "./components/categories-data-table"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Categories | Dashboard",
  description: "Manage your product categories",
}

export default function CategoriesPage() {
  return (
    <div className="flex flex-col gap-5 p-4">
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink>Categories</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      <div className="grid grid-cols-1">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Category Management</h1>
          <p className="text-muted-foreground">
            Create, update, and delete product categories
          </p>
        </div>
        <CategoriesDataTable />
      </div>
    </div>
  )
}