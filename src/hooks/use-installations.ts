import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Installation, InstallationStatus } from '@/types/installation';

// Interface for filtering installations
interface InstallationFilters {
  status?: InstallationStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// Get all installations with filtering
export function useInstallations(filters: InstallationFilters = {}) {
  return useQuery({
    queryKey: ['installations', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.search) params.append('search', filters.search);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());
      
      const response = await axios.get(`/api/installations?${params.toString()}`);
      return response.data;
    },
  });
}

// Get a single installation by ID
export function useInstallation(id: string) {
  return useQuery({
    queryKey: ['installation', id],
    queryFn: async () => {
      const response = await axios.get(`/api/installations/${id}`);
      return response.data.installation;
    },
    enabled: !!id,
  });
}

// Create a new installation
export function useCreateInstallation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (installationData: any) => {
      const response = await axios.post('/api/installations', installationData);
      return response.data.installation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installations'] });
    },
  });
}

// Update an installation
export function useUpdateInstallation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Installation> }) => {
      const response = await axios.patch(`/api/installations/${id}`, data);
      return response.data.installation;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['installations'] });
      queryClient.invalidateQueries({ queryKey: ['installation', variables.id] });
    },
  });
}

// Delete an installation
export function useDeleteInstallation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/installations/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installations'] });
    },
  });
}

// Update installation status
export function useUpdateInstallationStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InstallationStatus }) => {
      const response = await axios.patch(`/api/installations/${id}`, { status });
      return response.data.installation;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['installations'] });
      queryClient.invalidateQueries({ queryKey: ['installation', variables.id] });
    },
  });
}
