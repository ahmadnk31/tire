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
import { ChevronDown } from "lucide-react"
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
import { BrandForm } from "./brand-form"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

export type Brand = {
  id: string
  name: string
  description: string | null
  logoUrl: string | null
  logoKey: string | null
  popularityScore: number | null
  isActive: boolean
  createdAt: string
}

export const columns: ColumnDef<Brand>[] = [
  {
    accessorKey: "logoUrl",
    header: "Logo",
    cell: ({ row }) => (
      <div className="flex items-center justify-center h-16 w-16 relative">
        {row.original.logoUrl ? (
          <div className="relative h-12 w-12 overflow-hidden rounded">
            <Image 
              src={row.original.logoUrl} 
              alt={row.original.name}
              fill
              sizes="(max-width: 768px) 100vw, 48px"
              className="object-contain"
            />
          </div>
        ) : (
          <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center text-gray-400">
            No logo
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div>{row.getValue("name")}</div>,
  },  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate">
        {row.original.description || "No description"}
      </div>
    ),
  },
  {
    accessorKey: "popularityScore",
    header: "Popularity",
    cell: ({ row }) => {
      const score = row.getValue("popularityScore") as number | null;
      return (
        <div className="flex items-center">
          {score !== null ? (
            <>
              <div className="h-2 w-full bg-gray-200 rounded-full mr-2">
                <div 
                  className="h-2 bg-primary rounded-full" 
                  style={{ width: `${(score / 10) * 100}%` }}
                />
              </div>
              <span>{score}/10</span>
            </>
          ) : (
            <span>Not rated</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean;
      return (
        <div className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
          isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
        }`}>
          {isActive ? "Active" : "Inactive"}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              Edit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <BrandForm initialData={row.original} />
          </DialogContent>
        </Dialog>
      )
    },
  },
]

export function BrandsDataTable() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const { data: brandsData, isLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const response = await fetch("/api/brands")
      if (!response.ok) {
        throw new Error("Failed to fetch brands")
      }
      return response.json()
    },
  })

  // Extract brands array from the response
  const brands = brandsData?.brands || [];

  const table = useReactTable({
    data: brands,
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

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Brands</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Brand</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <BrandForm />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="flex items-center py-4">
          <Input
            placeholder="Filter brands..."
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
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}