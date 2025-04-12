"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react";

// API function to fetch inventory movements
async function fetchInventoryMovements() {
  const response = await fetch('/api/analytics/inventory-movements');
  if (!response.ok) {
    throw new Error('Failed to fetch inventory movements');
  }
  return response.json();
}

// Helper function to get badge color based on movement type
function getMovementTypeColor(type: string) {
  switch (type) {
    case 'PURCHASE':
      return 'bg-green-500 hover:bg-green-600';
    case 'SALE':
      return 'bg-blue-500 hover:bg-blue-600';
    case 'RETURN':
      return 'bg-purple-500 hover:bg-purple-600';
    case 'TRANSFER':
      return 'bg-yellow-500 hover:bg-yellow-600';
    case 'ADJUSTMENT':
      return 'bg-gray-500 hover:bg-gray-600';
    case 'DAMAGED':
      return 'bg-red-500 hover:bg-red-600';
    case 'EXPIRED':
      return 'bg-orange-500 hover:bg-orange-600';
    default:
      return 'bg-gray-500 hover:bg-gray-600';
  }
}

export function InventoryMovementHistory() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory-movements'],
    queryFn: fetchInventoryMovements,
  });
  
  if (isLoading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        Loading inventory movement data...
      </div>
    );
  }
  
  if (error || !data?.success) {
    return (
      <div className="flex h-[300px] items-center justify-center text-red-500">
        Error loading inventory movement data
      </div>
    );
  }
  
  if (!data.inventoryMovements || data.inventoryMovements.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        No inventory movement data available
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Product</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Location</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Quantity</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.inventoryMovements.map((movement: { id: Key | null | undefined; productName: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; locationName: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; locationType: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; movementType: string; quantity: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; date: string | number | Date; }) => (
            <tr key={movement.id} className="text-sm">
              <td className="px-4 py-4 font-medium">{movement.productName}</td>
              <td className="px-4 py-4">
                <div>{movement.locationName}</div>
                <div className="text-xs text-muted-foreground">{movement.locationType}</div>
              </td>
              <td className="px-4 py-4">
                <Badge className={getMovementTypeColor(movement.movementType)}>
                  {movement.movementType.charAt(0) + movement.movementType.slice(1).toLowerCase()}
                </Badge>
              </td>
              <td className="px-4 py-4 font-medium">
                {typeof movement.quantity === 'number' ? 
                  (movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity) : 
                  movement.quantity ?? '-'}
              </td>
              <td className="px-4 py-4">
                {format(new Date(movement.date), 'MMM d, yyyy')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}