import { useQuery } from "@tanstack/react-query";

// Type definitions for the API responses
export interface VehicleMake {
  id: string;
  name: string;
  logoUrl: string | null;
}

export interface VehicleModel {
  id: string;
  name: string;
  makeId: string;
  make: VehicleMake;
}

export interface VehicleYear {
  id: string;
  year: number;
  trimId: string;
}

// Function to fetch vehicle makes
const fetchVehicleMakes = async (): Promise<VehicleMake[]> => {
  const response = await fetch('/api/vehicle-makes');
  if (!response.ok) {
    throw new Error('Failed to fetch vehicle makes');
  }
  return response.json();
};

// Function to fetch vehicle models for a specific make
const fetchVehicleModels = async (makeId: string): Promise<VehicleModel[]> => {
  if (!makeId) return [];
  
  const response = await fetch(`/api/vehicle-models?makeId=${makeId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch vehicle models');
  }
  return response.json();
};

// Function to fetch vehicle years for a specific model
const fetchVehicleYears = async (modelId: string): Promise<number[]> => {
  if (!modelId) return [];
  
  const response = await fetch(`/api/vehicle-years?modelId=${modelId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch vehicle years');
  }
  const data: VehicleYear[] = await response.json();
  
  // Extract unique years as numbers and sort in descending order
  return Array.from<number>(new Set(data.map(item => item.year)))
    .sort((a, b) => b - a);
};

// Hook to fetch vehicle makes
export function useVehicleMakes() {
  return useQuery({
    queryKey: ['vehicleMakes'],
    queryFn: fetchVehicleMakes,
  });
}

// Hook to fetch vehicle models for a specific make
export function useVehicleModels(makeId: string) {
  return useQuery({
    queryKey: ['vehicleModels', makeId],
    queryFn: () => fetchVehicleModels(makeId),
    enabled: !!makeId, // Only run the query if makeId is provided
  });
}

// Hook to fetch vehicle years for a specific model
export function useVehicleYears(modelId: string) {
  return useQuery({
    queryKey: ['vehicleYears', modelId],
    queryFn: () => fetchVehicleYears(modelId),
    enabled: !!modelId, // Only run the query if modelId is provided
  });
}