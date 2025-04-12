"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react";

// API function to fetch recent order details
async function fetchRecentOrderDetails() {
  const response = await fetch('/api/analytics/recent-order-details');
  if (!response.ok) {
    throw new Error('Failed to fetch recent order details');
  }
  return response.json();
}

// Helper function to get badge color based on status
function getStatusColor(status: string) {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-500 hover:bg-yellow-600';
    case 'PROCESSING':
      return 'bg-blue-500 hover:bg-blue-600';
    case 'SHIPPED':
      return 'bg-green-500 hover:bg-green-600';
    case 'DELIVERED':
      return 'bg-emerald-500 hover:bg-emerald-600';
    case 'CANCELLED':
      return 'bg-red-500 hover:bg-red-600';
    default:
      return 'bg-gray-500 hover:bg-gray-600';
  }
}

function getPaymentStatusColor(status: string) {
  switch (status) {
    case 'PAID':
      return 'bg-green-500 hover:bg-green-600';
    case 'PENDING':
      return 'bg-yellow-500 hover:bg-yellow-600';
    case 'FAILED':
      return 'bg-red-500 hover:bg-red-600';
    case 'REFUNDED':
      return 'bg-purple-500 hover:bg-purple-600';
    default:
      return 'bg-gray-500 hover:bg-gray-600';
  }
}

export function RecentOrderDetails() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['recent-order-details'],
    queryFn: fetchRecentOrderDetails,
  });
  
  if (isLoading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        Loading recent order details...
      </div>
    );
  }
  
  if (error || !data?.success) {
    return (
      <div className="flex h-[300px] items-center justify-center text-red-500">
        Error loading recent order details
      </div>
    );
  }
  
  if (!data.recentOrders || data.recentOrders.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        No recent orders available
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Order #</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Customer</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Total</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Payment</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.recentOrders.map((order: { id: Key | null | undefined; orderNumber: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; customerName: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; customerEmail: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; date: string | number | Date; status: string; total: { toLocaleString: () => string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }; paymentStatus: string; }) => (
            <tr key={order.id} className="text-sm">
              <td className="px-4 py-4 font-medium">{order.orderNumber}</td>
              <td className="px-4 py-4">
                <div className="font-medium">{order.customerName}</div>
                <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
              </td>
              <td className="px-4 py-4">
                {format(new Date(order.date), 'MMM d, yyyy')}
              </td>
              <td className="px-4 py-4">
                <Badge className={getStatusColor(order.status)}>
                  {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                </Badge>
              </td>
              <td className="px-4 py-4 font-medium">
                ${order.total.toLocaleString()}
              </td>
              <td className="px-4 py-4">
                <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                  {order.paymentStatus.charAt(0) + order.paymentStatus.slice(1).toLowerCase()}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}