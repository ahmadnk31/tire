"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, Loader2 } from "lucide-react"
import Image from "next/image"

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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductForm } from "./product-form"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export type Product = {
  id: string
  name: string
  description: string | null
  sku: string | null
  retailPrice: number
  wholesalePrice: number
  discount: number
  retailerDiscount: number
  salePrice: number | null
  wholesaleSalePrice: number | null
  brandId: string
  modelId: string
  categoryId: string
  stock: number
  images: string[]
  imageKeys?: string[]
  brand: { id: string; name: string; logoUrl?: string }
  model: { id: string; name: string }
  category: { id: string; name: string }
  width: number
  aspectRatio: number
  rimDiameter: number
  loadIndex: number
  speedRating: string
  treadDepth?: number | null
  sidewallType?: string | null
  tireType: string
  constructionType: string | null
  runFlat: boolean
  reinforced: boolean
  treadPattern?: string | null
  wetGrip?: string | null
  fuelEfficiency?: string | null
  noiseLevel?: string | null
  snowRating?: string | null
  treadwear?: number | null
  traction?: string | null
  temperature?: string | null
  mileageWarranty?: number | null
  plyRating?: number | null
  maxInflationPressure?: number | null
  maxLoad?: number | null
  manufacturerPartNumber?: string | null
  certifications?: string | null
  countryOfOrigin?: string | null
  isVisible: boolean
  isFeatured: boolean
  isDiscontinued: boolean
  createdAt: string
  updatedAt: string
}

export type PaginatedResponse = {
  products: Product[]
  meta: {
    currentPage: number
    pageSize: number
    totalPages: number
    totalCount: number
  }
}

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "images",
    header: "Image",
    cell: ({ row }) => (
      <div className="flex items-center justify-center h-16 w-16 relative">
        {row.original.images && row.original.images.length > 0 ? (
          <div className="relative h-12 w-12 overflow-hidden rounded">
            <Image 
              src={row.original.images[0]} 
              alt={row.original.name}
              fill
              sizes="(max-width: 768px) 100vw, 48px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center text-gray-400">
            No image
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div>{row.getValue("name")}</div>,
  },
  {
    accessorKey: "brand.name",
    header: "Brand",
    cell: ({ row }) => <div>{row.original.brand?.name || "—"}</div>,
  },
  {
    accessorKey: "model.name",
    header: "Model",
    cell: ({ row }) => <div>{row.original.model?.name || "—"}</div>,
  },
  {
    accessorKey: "category.name",
    header: "Category",
    cell: ({ row }) => <div>{row.original.category?.name || "—"}</div>,
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex gap-1 flex-wrap">
          {!product.isVisible && (
            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
              Hidden
            </span>
          )}
          {product.isFeatured && (
            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
              Featured
            </span>
          )}
          {product.isDiscontinued && (
            <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
              Discontinued
            </span>
          )}
          {product.isVisible && !product.isDiscontinued && !product.isFeatured && (
            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
              Active
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "retailPrice",
    header: "Retail Price",
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("retailPrice"));
      const discount = row.original.discount || 0;
      const salePrice = price - (price * discount / 100);
      
      return (
        <div className="flex flex-col">
          {discount > 0 ? (
            <>
              <span className="line-through text-muted-foreground text-sm">${price.toFixed(2)}</span>
              <span className="font-medium text-green-600">${salePrice.toFixed(2)}</span>
              <span className="text-xs text-muted-foreground">(-{discount}%)</span>
            </>
          ) : (
            <span>${price.toFixed(2)}</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "wholesalePrice",
    header: "Wholesale Price",
    cell: ({ row }) => {
      const price = row.original.wholesalePrice || 0;
      const discount = row.original.retailerDiscount || 0;
      const salePrice = price - (price * discount / 100);
      
      return (
        <div className="flex flex-col">
          {discount > 0 ? (
            <>
              <span className="line-through text-muted-foreground text-sm">${price.toFixed(2)}</span>
              <span className="font-medium text-orange-600">${salePrice.toFixed(2)}</span>
              <span className="text-xs text-muted-foreground">(-{discount}%)</span>
            </>
          ) : (
            <span>${price.toFixed(2)}</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => <div>{row.getValue("stock")}</div>,
  },
  // Tire size column
  {
    id: "tireSize",
    header: "Size",
    cell: ({ row }) => (
      <div>
        {row.original.width}/{row.original.aspectRatio}R{row.original.rimDiameter}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      // Transform the data to ensure nullable fields have proper defaults
      const transformedData = {
        ...row.original,
        treadDepth: row.original.treadDepth || 0, // Convert null/undefined to 0
        sidewallType: row.original.sidewallType || "", // Convert null/undefined to empty string
        treadPattern: row.original.treadPattern || "",
        wetGrip: row.original.wetGrip || "",
        fuelEfficiency: row.original.fuelEfficiency || "",
        noiseLevel: row.original.noiseLevel || "",
        snowRating: row.original.snowRating || "",
        treadwear: row.original.treadwear || 0,
        traction: row.original.traction || "",
        temperature: row.original.temperature || "",
        mileageWarranty: row.original.mileageWarranty || 0,
        plyRating: row.original.plyRating || 0,
        maxInflationPressure: row.original.maxInflationPressure ? String(row.original.maxInflationPressure) : null,
        maxLoad: row.original.maxLoad ? String(row.original.maxLoad) : null,
        manufacturerPartNumber: row.original.manufacturerPartNumber || "",
        certifications: row.original.certifications || "",
        countryOfOrigin: row.original.countryOfOrigin || "",
      }
      
      return (
        <Dialog>
          
          <DialogTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              Edit
            </Button>
          </DialogTrigger>
          <DialogContent className="h-[90vh] overflow-y-auto min-w-[700px]">
            <DialogTitle></DialogTitle>
            <ProductForm initialData={transformedData} />
          </DialogContent>
        </Dialog>
      )
    },
  },
]

export function ProductsDataTable() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ["products", page, pageSize],
    queryFn: async () => {
      const response = await fetch(`/api/products?page=${page}&limit=${pageSize}`)
      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }
      const data = await response.json()
      console.log("Fetched products data:", data)
      return data
    },
  })
  console.log("Products data:", data)
  // Extract products and metadata from the paginated response
  const products = data?.products || []
  
  // Update pagination state when data changes
  if (data?.meta) {
    if (totalPages !== data.meta.totalPages) {
      setTotalPages(data.meta.totalPages)
    }
    if (totalItems !== data.meta.totalCount) {
      setTotalItems(data.meta.totalCount)
    }
  }

  const table = useReactTable({
    data: products,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Products</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Product</Button>
          </DialogTrigger>
          <DialogContent className="min-w-[700px] h-[90vh] overflow-y-auto">
            <ProductForm />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="flex items-center py-4">
          <Input
            placeholder="Filter products..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {totalItems > 0 ? (
              <>
                Showing {products.length} of {totalItems} product(s) • Page {page} of {totalPages}
              </>
            ) : (
              "No products found"
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}