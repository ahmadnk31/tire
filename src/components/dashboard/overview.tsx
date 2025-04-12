"use client";

import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

// API function to fetch monthly sales data
async function fetchMonthlySales() {
  const response = await fetch('/api/analytics/monthly-sales');
  if (!response.ok) {
    throw new Error('Failed to fetch monthly sales data');
  }
  return response.json();
}

export function Overview() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['monthly-sales'],
    queryFn: fetchMonthlySales,
  });
  
  if (isLoading) {
    return <div className="flex h-[350px] items-center justify-center">Loading sales data...</div>;
  }
  
  if (error || !data?.success) {
    return <div className="flex h-[350px] items-center justify-center text-red-500">Error loading sales data</div>;
  }
  
  if (!data.monthlySales || data.monthlySales.length === 0) {
    return <div className="flex h-[350px] items-center justify-center">No sales data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data.monthlySales}>
        <XAxis
          dataKey="month"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <Tooltip 
          formatter={(value, name) => {
            if (name === "revenue") return [`$${value}`, "Revenue"];
            return [value, "Orders"];
          }}
        />
        <Bar
          dataKey="revenue"
          fill="#adfa1d"
          radius={[4, 4, 0, 0]}
          name="Revenue"
        />
        <Bar
          dataKey="orders"
          fill="#006aff"
          radius={[4, 4, 0, 0]}
          name="Orders"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}