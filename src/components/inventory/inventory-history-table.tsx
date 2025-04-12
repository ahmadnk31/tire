"use client"

import { useEffect, useState } from "react"
import { getInventoryItemMovements } from "@/lib/inventory"
import { formatDistanceToNow } from "date-fns"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowDown, ArrowUp, RotateCcw } from "lucide-react"

interface InventoryMovement {
  id: string
  inventoryId: string
  quantity: number
  movementType: string
  reason: string | null
  notes: string | null
  createdAt: Date
}

interface InventoryHistoryTableProps {
  inventoryId: string
}

export function InventoryHistoryTable({ inventoryId }: InventoryHistoryTableProps) {
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function fetchMovements() {
      try {
        setLoading(true)
        const data = await getInventoryItemMovements(inventoryId)
        setMovements(data)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch inventory movements:", err)
        setError("Failed to load inventory history")
      } finally {
        setLoading(false)
      }
    }
    
    fetchMovements()
  }, [inventoryId])
  
  // Function to render badge by movement type
  const getMovementBadge = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return <Badge className="bg-green-500">Purchase</Badge>
      case "SALE":
        return <Badge className="bg-blue-500">Sale</Badge>
      case "RETURN":
        return <Badge className="bg-purple-500">Return</Badge>
      case "TRANSFER":
        return <Badge className="bg-orange-500">Transfer</Badge>
      case "ADJUSTMENT":
        return <Badge className="bg-gray-500">Adjustment</Badge>
      case "DAMAGED":
        return <Badge variant="destructive">Damaged</Badge>
      case "EXPIRED":
        return <Badge variant="destructive">Expired</Badge>
      default:
        return <Badge variant="outline">Other</Badge>
    }
  }
  
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-destructive">{error}</p>
        <button 
          onClick={() => getInventoryItemMovements(inventoryId).then(setMovements).catch(() => {})}
          className="mt-2 text-sm text-primary flex items-center justify-center mx-auto"
        >
          <RotateCcw className="mr-1 h-3 w-3" /> Try again
        </button>
      </div>
    )
  }
  
  if (movements.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No movement history available for this product.
      </div>
    )
  }
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => (
            <TableRow key={movement.id}>
              <TableCell>
                <div className="font-medium">
                  {new Date(movement.createdAt).toLocaleDateString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(movement.createdAt), { addSuffix: true })}
                </div>
              </TableCell>
              <TableCell>{getMovementBadge(movement.movementType)}</TableCell>
              <TableCell>
                <div className={`flex items-center ${movement.quantity > 0 ? "text-green-600" : "text-destructive"}`}>
                  {movement.quantity > 0 ? (
                    <ArrowUp className="mr-1 h-4 w-4" />
                  ) : (
                    <ArrowDown className="mr-1 h-4 w-4" />
                  )}
                  {Math.abs(movement.quantity)}
                </div>
              </TableCell>
              <TableCell>{movement.reason || "—"}</TableCell>
              <TableCell className="max-w-[200px] truncate">{movement.notes || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}