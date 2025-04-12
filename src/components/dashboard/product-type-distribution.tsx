"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

// This component will display tire type distribution data
export function ProductTypeDistribution() {
  const [data, setData] = useState<Array<{name: string, value: number, color: string}>>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/analytics/tire-types');
        const result = await response.json();
        
        if (result.tireTypes) {
          // Map the tire types to a format suitable for the chart
          const chartData = result.tireTypes.map((item: any, index: number) => {
            // Generate a color based on index
            const colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ff7300", "#004D99", "#808000"];
            return {
              name: item.tireType,
              value: item.count,
              color: colors[index % colors.length]
            };
          });
          
          setData(chartData);
        }
      } catch (error) {
        console.error("Error fetching tire type data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  if (loading) {
    return <div className="flex h-[350px] items-center justify-center">Loading tire type data...</div>;
  }
  
  if (data.length === 0) {
    return <div className="flex h-[350px] items-center justify-center">No tire type data available</div>;
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
        <Tooltip formatter={(value) => [`${value} items`, "Quantity"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}