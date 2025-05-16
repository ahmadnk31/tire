"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient  from "@/lib/api-client";
import { toast } from "sonner";

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: string | null;
  createdAt: string;
  updatedAt: string;
  isBanned?: boolean;
  image?: string;
}

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: string;
}

interface UpdateUserInput {
  id: string;
  data: {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
  };
}

interface BanUserInput {
  userId: string;
  isBanned: boolean;
}

interface SendEmailInput {
  userId: string;
  subject: string;
  content: string;
}

// User queries
export function useGetUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const response = await apiClient.get<User[]>("/api/admin/users");
      return response.data;
    }
  });
}

export function useGetUser(userId: string | null) {
  return useQuery({
    queryKey: ["admin", "users", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");
      const response = await apiClient.get<User>(`/api/admin/users/${userId}`);
      return response.data;
    },
    enabled: !!userId
  });
}

// User mutations
export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateUserInput) => {
      const response = await apiClient.post<User>("/api/admin/users", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User created successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to create user: ${error.message || "Unknown error"}`);
    }
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: UpdateUserInput) => {
      const response = await apiClient.patch<User>(`/api/admin/users/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", variables.id] });
      toast.success("User updated successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to update user: ${error.message || "Unknown error"}`);
    }
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.delete(`/api/admin/users/${userId}`);
      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User deleted successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete user: ${error.message || "Unknown error"}`);
    }
  });
}

export function useSetUserBanStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, isBanned }: BanUserInput) => {
      const response = await apiClient.patch<User>(`/api/admin/users/${userId}/ban`, { isBanned });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", variables.userId] });
      toast.success(`User ${variables.isBanned ? "banned" : "unbanned"} successfully`);
    },
    onError: (error: any) => {
      toast.error(`Failed to update user ban status: ${error.message || "Unknown error"}`);
    }
  });
}

export function useSendUserEmail() {
  return useMutation({
    mutationFn: async ({ userId, subject, content }: SendEmailInput) => {
      const response = await apiClient.post(`/api/admin/users/${userId}/email`, { subject, content });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Email sent successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to send email: ${error.message || "Unknown error"}`);
    }
  });
}
