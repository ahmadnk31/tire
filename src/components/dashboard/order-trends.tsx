"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export function OrderTrends() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/analytics/order-trends');
        const result = await response.json();
        
        if (result.success && result.orderTrends) {
          setData(result.orderTrends);
        }
      } catch (error) {
        console.error("Error fetching order trends data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  if (loading) {
    return <div className="flex h-[350px] items-center justify-center">Loading order trends data...</div>;
  }
  
  if (data.length === 0) {
    return <div className="flex h-[350px] items-center justify-center">No order data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" />
        <YAxis />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip 
          formatter={(value) => [`${value} orders`, "Orders"]}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Area 
          type="monotone" 
          dataKey="count" 
          stroke="#8884d8" 
          fillOpacity={1} 
          fill="url(#colorOrders)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}