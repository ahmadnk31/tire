import { Card, CardContent } from "@/components/ui/card"
import { 
  Package, 
  PackageCheck, 
  PackageMinus, 
  PackageX 
} from "lucide-react"

interface InventoryStatsProps {
  totalProducts: number
  inStock: number
  lowStock: number
  outOfStock: number
}

export function InventoryStats({
  totalProducts,
  inStock,
  lowStock,
  outOfStock,
}: InventoryStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Products</p>
              <h3 className="text-2xl font-bold">{totalProducts}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-500/10 p-3 rounded-full">
              <PackageCheck className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">In Stock</p>
              <h3 className="text-2xl font-bold">{inStock}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-amber-500/10 p-3 rounded-full">
              <PackageMinus className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
              <h3 className="text-2xl font-bold">{lowStock}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-destructive/10 p-3 rounded-full">
              <PackageX className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
              <h3 className="text-2xl font-bold">{outOfStock}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}