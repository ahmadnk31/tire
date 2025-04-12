"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface RecentOrder {
  id: string;
  customerName: string;
  email: string;
  total: number;
  date: string;
}

export function RecentSales() {
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/analytics/recent-orders');
        const result = await response.json();
        
        if (result.success && result.recentOrders) {
          setRecentOrders(result.recentOrders);
        }
      } catch (error) {
        console.error("Error fetching recent orders:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  if (loading) {
    return <div className="flex h-[350px] items-center justify-center">Loading recent sales data...</div>;
  }
  
  if (recentOrders.length === 0) {
    return <div className="flex h-[350px] items-center justify-center">No recent sales data available</div>;
  }

  return (
    <div className="space-y-8">
      {recentOrders.map((order) => (
        <div key={order.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src="/placeholder-user.jpg" alt={order.customerName} />
            <AvatarFallback>
              {order.customerName.split(' ').map(name => name[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{order.customerName}</p>
            <p className="text-sm text-muted-foreground">
              {order.email}
            </p>
          </div>
          <div className="ml-auto font-medium">+${order.total.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}