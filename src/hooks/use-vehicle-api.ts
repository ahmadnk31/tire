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

// Fetch vehicle makes
async function fetchVehicleMakes(): Promise<VehicleMake[]> {
  const response = await fetch('/api/vehicle-makes');
  if (!response.ok) throw new Error('Failed to fetch vehicle makes');
  return response.json();
}

// Fetch vehicle models by make ID
async function fetchVehicleModels(makeId: string): Promise<VehicleModel[]> {
  if (!makeId) return [];
  const response = await fetch(`/api/vehicle-models?makeId=${makeId}`);
  if (!response.ok) throw new Error('Failed to fetch vehicle models');
  return response.json();
}

// Fetch vehicle years by model ID
async function fetchVehicleYears(modelId: string): Promise<number[]> {
  if (!modelId) return [];
  const response = await fetch(`/api/vehicle-years?modelId=${modelId}`);
  if (!response.ok) throw new Error('Failed to fetch vehicle years');
  const data: VehicleYear[] = await response.json();
  // Extract unique years as numbers
  return Array.from<number>(new Set(data.map(item => item.year)))
    .sort((a, b) => b - a); // Sort in descending order
}

// Hook for fetching vehicle makes
export function useVehicleMakes() {
  return useQuery({
    queryKey: ['vehicleMakes'],
    queryFn: fetchVehicleMakes,
  });
}

// Hook for fetching vehicle models
export function useVehicleModels(makeId: string) {
  return useQuery({
    queryKey: ['vehicleModels', makeId],
    queryFn: () => fetchVehicleModels(makeId),
    enabled: !!makeId, // Only run the query if makeId is provided
  });
}

// Hook for fetching vehicle years
export function useVehicleYears(modelId: string) {
  return useQuery({
    queryKey: ['vehicleYears', modelId],
    queryFn: () => fetchVehicleYears(modelId),
    enabled: !!modelId, // Only run the query if modelId is provided
  });
}

// Type for popular vehicles
export interface PopularVehicle {
  id: string;
  make: string;
  model: string;
  image: string;
  productCount?: number;
}

// Fetch popular vehicles
async function fetchPopularVehicles(): Promise<PopularVehicle[]> {
  const response = await fetch('/api/models/popular');
  if (!response.ok) throw new Error('Failed to fetch popular vehicles');
  const data = await response.json();
  
  // Transform the data to match the expected format
  return data.models.map((item: any) => ({
    id: item.id,
    make: item.make,
    model: item.model,
    image: item.brandLogo || "/placeholder.jpg",
    productCount: item.productCount
  }));
}

// Hook for fetching popular vehicles
export function usePopularVehicles() {
  return useQuery({
    queryKey: ['popularVehicles'],
    queryFn: fetchPopularVehicles,
  });
}