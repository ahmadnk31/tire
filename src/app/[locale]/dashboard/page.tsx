import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Overview } from "@/components/dashboard/overview";
import { RecentSales } from "@/components/dashboard/recent-sales";
import { InventoryLevels } from "@/components/dashboard/inventory-levels";
import { TopSellingProducts } from "@/components/dashboard/top-selling-products";
import { CategorySales } from "@/components/dashboard/category-sales";
import { ProductTypeDistribution } from "@/components/dashboard/product-type-distribution";
import { OrderTrends } from "@/components/dashboard/order-trends";
import { CalendarDateRangePicker } from "@/components/dashboard/date-range-picker";
import { CustomerTypeDistribution } from "@/components/dashboard/customer-type-distribution";
import { OrderStatusDistribution } from "@/components/dashboard/order-status-distribution";
import { RecentOrderDetails } from "@/components/dashboard/recent-order-details";
import { InventoryMovementHistory } from "@/components/dashboard/inventory-movement-history";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";

export default async function Dashboard() {
  // Fetch key metrics from database
  const totalOrders = await prisma.order.count();
  
  const totalRevenue = await prisma.order.aggregate({
    _sum: {
      total: true
    },
    where: {
      paymentStatus: "PAID"
    }
  });
  
  // Get low stock items
  const lowStockProducts = await prisma.inventory.count({
    where: {
      quantity: {
        lte: 5
      }
    }
  });
  
  // Get pending orders
  const pendingOrders = await prisma.order.count({
    where: {
      status: "PENDING"
    }
  });

  // Get recent date for "today" metrics
  const today = new Date();
  const startOfToday = new Date(today.setHours(0, 0, 0, 0));
  
  const todayOrders = await prisma.order.count({
    where: {
      createdAt: {
        gte: startOfToday
      }
    }
  });

  const todayRevenue = await prisma.order.aggregate({
    _sum: {
      total: true
    },
    where: {
      createdAt: {
        gte: startOfToday
      },
      paymentStatus: "PAID"
    }
  });
  
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
        <div className="flex items-center space-x-2">
          <CalendarDateRangePicker />
          <Button>Download Report</Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
          <TabsTrigger value="orders">Order Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalRevenue._sum.total?.toLocaleString() ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  +${todayRevenue._sum.total?.toLocaleString() ?? 0} today
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOrders.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +{todayOrders} today
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Requiring fulfillment
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lowStockProducts}</div>
                <p className="text-xs text-muted-foreground">
                  Products below minimum level
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
                <CardDescription>Monthly revenue and order volume</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview />
              </CardContent>
            </Card>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest customer purchases</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentSales />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Inventory Levels by Location</CardTitle>
                <CardDescription>Stock levels across warehouses and stores</CardDescription>
              </CardHeader>
              <CardContent>
                <InventoryLevels />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
                <CardDescription>Best performing products by sales</CardDescription>
              </CardHeader>
              <CardContent>
                <TopSellingProducts />
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Inventory Movement History</CardTitle>
                <CardDescription>Recent stock changes and transfers</CardDescription>
              </CardHeader>
              <CardContent>
                <InventoryMovementHistory />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Tire Type Distribution</CardTitle>
                <CardDescription>Stock breakdown by tire type</CardDescription>
              </CardHeader>
              <CardContent>
                <ProductTypeDistribution />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
                <CardDescription>Revenue distribution by product category</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <CategorySales />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Retailer vs. Consumer</CardTitle>
                <CardDescription>Sales breakdown by customer type</CardDescription>
              </CardHeader>
              <CardContent>
                <CustomerTypeDistribution />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="orders" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Order Trends</CardTitle>
                <CardDescription>Historical order patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <OrderTrends />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
                <CardDescription>Current order status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <OrderStatusDistribution />
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Order Details</CardTitle>
                <CardDescription>Processing and fulfillment status</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentOrderDetails />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}