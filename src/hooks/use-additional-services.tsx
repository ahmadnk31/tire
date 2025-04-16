"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface AdditionalService {
  description: string;
  id: string;
  serviceName: string;
  price: number;
}

/**
 * Hook to fetch all available additional services
 */
export function useAdditionalServices() {
  return useQuery({
    queryKey: ["additional-services"],
    queryFn: async () => {
      const response = await axios.get("/api/additional-services");
      return response.data as AdditionalService[];
    },
  });
}

/**
 * Hook to fetch additional services for a specific installation
 */
export function useInstallationAdditionalServices(installationId: string | undefined) {
  return useQuery({
    queryKey: ["installation-additional-services", installationId],
    queryFn: async () => {
      if (!installationId) return [];
      const response = await axios.get(`/api/installations/${installationId}/additional-services`);
      return response.data as AdditionalService[];
    },
    enabled: !!installationId,
  });
}
