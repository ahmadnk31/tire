"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";

export function InventoryLevels() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/analytics/inventory-levels');
        const result = await response.json();
        
        if (result.success && result.inventoryData) {
          setData(result.inventoryData);
        }
      } catch (error) {
        console.error("Error fetching inventory levels data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  if (loading) {
    return <div className="flex h-[350px] items-center justify-center">Loading inventory data...</div>;
  }
  
  if (data.length === 0) {
    return <div className="flex h-[350px] items-center justify-center">No inventory data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip
          formatter={(value, name) => {
            if (name === "current") return [value, "Current Stock"];
            return [value, "Minimum Level"];
          }}
        />
        <Legend />
        <Bar 
          dataKey="current" 
          fill="#82ca9d" 
          name="Current Stock"
          radius={[4, 4, 0, 0]}
        />
        <Bar 
          dataKey="minimum" 
          fill="#ff8884" 
          name="Minimum Level"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}