"use client";

import { useQuery } from "@tanstack/react-query";
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react";

// API function to fetch order status data
async function fetchOrderStatuses() {
  const response = await fetch('/api/analytics/order-statuses');
  if (!response.ok) {
    throw new Error('Failed to fetch order status data');
  }
  return response.json();
}

export function OrderStatusDistribution() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['order-statuses'],
    queryFn: fetchOrderStatuses,
  });
  
  if (isLoading) {
    return <div className="flex h-[300px] items-center justify-center">Loading order status data...</div>;
  }
  
  if (error || !data?.success) {
    return <div className="flex h-[300px] items-center justify-center text-red-500">Error loading order status data</div>;
  }
  
  if (!data.orderStatuses || data.orderStatuses.length === 0) {
    return <div className="flex h-[300px] items-center justify-center">No order status data available</div>;
  }

  return (
    <div className="space-y-4">
      {data.orderStatuses.map((status: { label: Key | null | undefined; value: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; color: any; count: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }) => (
        <div key={status.label} className="flex items-center">
          <div className="w-full">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {typeof status.label === 'string' 
                  ? status.label.charAt(0) + status.label.slice(1).toLowerCase()
                  : 'Unknown Status'}
              </span>
              <span className="text-sm text-muted-foreground">{status.value}%</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-muted">
              <div 
                className={`h-2 rounded-full ${status.color}`} 
                style={{ width: `${status.value}%` }}
              ></div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{status.count} orders</p>
          </div>
        </div>
      ))}
      <div className="pt-2 text-sm text-muted-foreground">
        Total Orders: {data.totalOrders}
      </div>
    </div>
  );
}