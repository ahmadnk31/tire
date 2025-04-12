"use client";

import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, SetStateAction, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SearchIcon,
  FilterIcon,
  MoreHorizontalIcon,
  EyeIcon,
  TruckIcon,
  PackageIcon,
  CheckIcon,
  XIcon,
  RefreshCwIcon,
} from "lucide-react";
import { ManualShippingBadge } from "./components/manual-shipping-badge";

// Fetch orders with pagination and filters
const fetchOrders = async ({ page, limit, status, search }: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) => {
  try {
    const params = new URLSearchParams();
    
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    if (status && status !== "ALL") params.append("status", status);
    if (search) params.append("search", search);
    
    console.log(`Fetching orders with params: ${params.toString()}`);
    const response = await axios.get(`/api/orders?${params.toString()}`);
    console.log("Orders API response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

// Status badge component
function OrderStatusBadge({ status }: { status: string }) {
  let badgeStyles = "";
  
  switch(status) {
    case "PENDING":
      badgeStyles = "bg-yellow-100 text-yellow-800 border-yellow-200";
      break;
    case "PROCESSING":
      badgeStyles = "bg-blue-100 text-blue-800 border-blue-200";
      break;
    case "SHIPPED":
      badgeStyles = "bg-purple-100 text-purple-800 border-purple-200";
      break;
    case "DELIVERED":
      badgeStyles = "bg-green-100 text-green-800 border-green-200";
      break;
    case "CANCELLED":
      badgeStyles = "bg-red-100 text-red-800 border-red-200";
      break;
    default:
      badgeStyles = "bg-gray-100 text-gray-800 border-gray-200";
  }
  
  return (
    <Badge variant="outline" className={badgeStyles}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}

// Payment status badge component
function PaymentStatusBadge({ status }: { status: string }) {
  let badgeStyles = "";
  
  switch(status) {
    case "PENDING":
      badgeStyles = "bg-yellow-100 text-yellow-800 border-yellow-200";
      break;
    case "PAID":
      badgeStyles = "bg-green-100 text-green-800 border-green-200";
      break;
    case "FAILED":
      badgeStyles = "bg-red-100 text-red-800 border-red-200";
      break;
    case "REFUNDED":
      badgeStyles = "bg-purple-100 text-purple-800 border-purple-200";
      break;
    default:
      badgeStyles = "bg-gray-100 text-gray-800 border-gray-200";
  }
  
  return (
    <Badge variant="outline" className={badgeStyles}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  
  // React Query hook for fetching orders with proper configuration
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["orders", page, limit, status, search],
    queryFn: () => fetchOrders({ page, limit, status, search }),
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 30000, // 30 seconds
  });
  
  // Handle status update (this would call your update API endpoint)
  const handleStatusUpdate = async (orderId: Key | null | undefined, newStatus: string) => {
    try {
      await axios.patch(`/api/orders/${orderId}`, { status: newStatus });
      refetch(); // Refetch orders to update the UI
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };
  
  // Handle search input
  const handleSearch = (e: { target: { value: SetStateAction<string>; }; }) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on new search
  };
  
  // Calculate pagination values
  const totalPages = data?.meta?.totalPages || 1;
  const currentPage = data?.meta?.currentPage || 1;
  
  // Generate pagination links
  const generatePaginationLinks = () => {
    const links = [];
    
    // Add first and previous page links
    links.push(
      <PaginationItem key="previous">
        <PaginationPrevious 
          onClick={() => page > 1 ? setPage(page - 1) : null}
          className={page <= 1 ? "pointer-events-none opacity-50" : ""}
        />
      </PaginationItem>
    );
    
    // Calculate range of pages to show
    const startPage = Math.max(1, page - 1);
    const endPage = Math.min(totalPages, page + 1);
    
    // Add page number links
    for (let i = startPage; i <= endPage; i++) {
      links.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => setPage(i)}
            isActive={i === page}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Add ellipsis if needed
    if (endPage < totalPages) {
      links.push(
        <PaginationItem key="ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Add next page link
    links.push(
      <PaginationItem key="next">
        <PaginationNext 
          onClick={() => page < totalPages ? setPage(page + 1) : null}
          className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
        />
      </PaginationItem>
    );
    
    return links;
  };
  
  console.log("Current data:", data);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage and track customer orders
          </p>
        </div>
        <Button onClick={() => refetch()}>
          <RefreshCwIcon className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      
      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number, customer, or location..."
            className="pl-8"
            value={search}
            onChange={handleSearch}
          />
        </div>
        
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="SHIPPED">Shipped</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={limit.toString()} onValueChange={(value) => {
          setLimit(Number(value));
          setPage(1); // Reset to first page
        }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Items per page" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 per page</SelectItem>
            <SelectItem value="25">25 per page</SelectItem>
            <SelectItem value="50">50 per page</SelectItem>
            <SelectItem value="100">100 per page</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Order count summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-2">
            <CardTitle className="text-sm font-medium">New Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : 
               data?.orders?.filter((order: { status: string; }) => order.status === "PENDING").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requiring attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : 
               data?.orders?.filter((order: { status: string; }) => order.status === "PROCESSING").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for shipment
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-2">
            <CardTitle className="text-sm font-medium">Shipped</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : 
               data?.orders?.filter((order: { status: string; }) => order.status === "SHIPPED").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              In transit
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : 
               data?.orders?.filter((order: { status: string; }) => order.status === "DELIVERED").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Completed orders
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Orders table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : isError ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-red-500">Error loading orders: {error?.message || "Unknown error"}</div>
            </div>
          ) : data?.orders?.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-muted-foreground">No orders found</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.orders?.map((order: { id: Key | null | undefined; orderNumber: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; customer: { name: any; }; createdAt: string | number | Date; status: unknown; paymentStatus: unknown; itemCount: any; items: string | any[]; total: number; }) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{order.customer?.name || "N/A"}</TableCell>
                    <TableCell>{format(new Date(order.createdAt), "MMM d, yyyy")}</TableCell>                    <TableCell className="flex items-center">
                      <OrderStatusBadge status={order.status as string} />
                      {order.orderNumber && <ManualShippingBadge trackingNumber={order.orderNumber as string} />}
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={order.paymentStatus as string} />
                    </TableCell>
                    <TableCell>{order.itemCount || order.items?.length || 0}</TableCell>
                    <TableCell className="text-right">
                      ${order.total?.toFixed(2) || "0.00"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontalIcon className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => window.location.href = `/dashboard/orders/${order.id}`}>
                            <EyeIcon className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(order.id, "PROCESSING")}
                            disabled={order.status === "PROCESSING" || order.status === "SHIPPED" || order.status === "DELIVERED" || order.status === "CANCELLED"}
                          >
                            <PackageIcon className="mr-2 h-4 w-4" />
                            Mark as Processing
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(order.id, "SHIPPED")}
                            disabled={order.status === "SHIPPED" || order.status === "DELIVERED" || order.status === "CANCELLED"}
                          >
                            <TruckIcon className="mr-2 h-4 w-4" />
                            Mark as Shipped
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(order.id, "DELIVERED")}
                            disabled={order.status === "DELIVERED" || order.status === "CANCELLED"}
                          >
                            <CheckIcon className="mr-2 h-4 w-4" />
                            Mark as Delivered
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(order.id, "CANCELLED")}
                            disabled={order.status === "CANCELLED" || order.status === "DELIVERED"}
                          >
                            <XIcon className="mr-2 h-4 w-4" />
                            Cancel Order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Manual shipping row example */}
                <TableRow>
                  <TableCell>Manual Shipping</TableCell>
                  <TableCell>John Doe</TableCell>
                  <TableCell>Jan 1, 2023</TableCell>
                  <TableCell>
                    <ManualShippingBadge />
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status="PAID" />
                  </TableCell>
                  <TableCell>2</TableCell>
                  <TableCell className="text-right">
                    $50.00
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontalIcon className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => window.location.href = `/dashboard/orders/1`}>
                          <EyeIcon className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleStatusUpdate(1, "PROCESSING")}
                          disabled={true}
                        >
                          <PackageIcon className="mr-2 h-4 w-4" />
                          Mark as Processing
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusUpdate(1, "SHIPPED")}
                          disabled={true}
                        >
                          <TruckIcon className="mr-2 h-4 w-4" />
                          Mark as Shipped
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusUpdate(1, "DELIVERED")}
                          disabled={true}
                        >
                          <CheckIcon className="mr-2 h-4 w-4" />
                          Mark as Delivered
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusUpdate(1, "CANCELLED")}
                          disabled={true}
                        >
                          <XIcon className="mr-2 h-4 w-4" />
                          Cancel Order
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
        
        {/* Pagination */}
        {data?.orders?.length > 0 && (
          <div className="py-4 border-t">
            <div className="flex justify-between items-center px-6">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data?.meta?.totalCount || 0)} of {data?.meta?.totalCount || 0} results
              </div>
              <Pagination>
                <PaginationContent>
                  {generatePaginationLinks()}
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}