"use client";

import { useQuery } from "@tanstack/react-query";

export interface BusinessHour {
  id: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, etc.
  isOpen: boolean;
  openTime: string; // Format: "HH:MM" in 24-hour format
  closeTime: string; // Format: "HH:MM" in 24-hour format
}

async function fetchBusinessHours(): Promise<BusinessHour[]> {
  const response = await fetch("/api/business-hours");
  
  if (!response.ok) {
    throw new Error("Failed to fetch business hours");
  }
  
  return response.json();
}

const useBusinessHours = () => {
  return useQuery({
    queryKey: ["businessHours"],
    queryFn: fetchBusinessHours,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
  });
};

export default useBusinessHours;
