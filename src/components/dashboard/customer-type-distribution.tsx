"use client";

import { useQuery } from "@tanstack/react-query";
import { ReactElement, JSXElementConstructor, ReactNode, ReactPortal, Key } from "react";

// API function to fetch customer type data
async function fetchCustomerTypes() {
  const response = await fetch('/api/analytics/customer-types');
  if (!response.ok) {
    throw new Error('Failed to fetch customer type data');
  }
  return response.json();
}

export function CustomerTypeDistribution() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['customer-types'],
    queryFn: fetchCustomerTypes,
  });
  
  if (isLoading) {
    return <div className="flex h-[200px] items-center justify-center">Loading customer data...</div>;
  }
  
  if (error || !data?.success) {
    return <div className="flex h-[200px] items-center justify-center text-red-500">Error loading customer data</div>;
  }
  
  if (!data.customerTypes || data.customerTypes.length === 0) {
    return <div className="flex h-[200px] items-center justify-center">No customer data available</div>;
  }

  // We show revenue percentage by default
  return (
    <div className="space-y-4">
      {data.customerTypes.map((type: { type: boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | Key | null | undefined; revenuePercentage: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; revenue: { toLocaleString: () => string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }; orderCount: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }) => (
        <div key={String(type.type)} className="flex items-center">
          <div className="w-full">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{type.type}</span>
              <span className="text-sm text-muted-foreground">{type.revenuePercentage}%</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-muted">
              <div 
                className={`h-2 rounded-full ${type.type === "Retailers" ? "bg-blue-500" : "bg-green-500"}`} 
                style={{ width: `${type.revenuePercentage}%` }}
              ></div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">${type.revenue.toLocaleString()} in revenue from {type.orderCount} orders</p>
          </div>
        </div>
      ))}
    </div>
  );
}