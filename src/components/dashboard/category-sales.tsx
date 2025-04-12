"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

export function CategorySales() {
  const [data, setData] = useState<Array<{name: string, value: number, color: string}>>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/analytics/category-sales');
        const result = await response.json();
        
        if (result.success && result.categorySales) {
          // Map the categories to a format suitable for the chart with colors
          const colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ff7300"];
          
          const chartData = result.categorySales.map((item: any, index: number) => ({
            name: item.name,
            value: item.revenue,
            color: colors[index % colors.length]
          }));
          
          setData(chartData);
        }
      } catch (error) {
        console.error("Error fetching category sales data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  if (loading) {
    return <div className="flex h-[350px] items-center justify-center">Loading category sales data...</div>;
  }
  
  if (data.length === 0) {
    return <div className="flex h-[350px] items-center justify-center">No category sales data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={100}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Revenue"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}