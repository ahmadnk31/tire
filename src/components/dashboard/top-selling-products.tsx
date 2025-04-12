"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export function TopSellingProducts() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/analytics/top-products');
        const result = await response.json();
        
        if (result.success && result.topProducts) {
          setData(result.topProducts);
        }
      } catch (error) {
        console.error("Error fetching top products data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  if (loading) {
    return <div className="flex h-[350px] items-center justify-center">Loading top products data...</div>;
  }
  
  if (data.length === 0) {
    return <div className="flex h-[350px] items-center justify-center">No product sales data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} layout="vertical">
        <XAxis type="number" />
        <YAxis 
          dataKey="name" 
          type="category" 
          scale="band" 
          width={120}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip 
          formatter={(value) => [`${value} units`, "Sold"]}
          labelFormatter={(name) => `Product: ${name}`}
        />
        <Bar dataKey="quantity" fill="#0f76c6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}