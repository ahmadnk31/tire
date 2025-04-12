"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  User,
  UserNotificationPreferences,
  PaymentMethod,
  RetailerProfile,
  fetchUserProfile,
  updateUserProfile,
  updateUserAvatar,
  updateNotificationPreferences,
  fetchPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  updatePassword,
  fetchRetailerProfile,
  updateRetailerProfile,
} from "@/lib/api/user-api";

// Query keys for caching
export const userQueryKeys = {
  profile: ["user", "profile"],
  notifications: ["user", "notifications"],
  paymentMethods: ["user", "payment-methods"],
  retailerProfile: ["user", "retailer-profile"],
};

// Hook for fetching user profile
export function useUserProfile() {
  return useQuery({
    queryKey: userQueryKeys.profile,
    queryFn: fetchUserProfile,
  });
}

// Hook for updating user profile
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<User>) => updateUserProfile(data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(userQueryKeys.profile, updatedUser);
      return updatedUser;
    },
  });
}

// Hook for updating user avatar
export function useUpdateUserAvatar() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (fileOrUrl: File | string) => updateUserAvatar(fileOrUrl),
    onSuccess: (data) => {
      queryClient.setQueryData<User | undefined>(
        userQueryKeys.profile,
        (oldData) => {
          if (!oldData) return undefined;
          return {
            ...oldData,
            avatar: data.avatarUrl,
          };
        }
      );
      return data;
    },
  });
}

// Hook for updating notification preferences
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (preferences: UserNotificationPreferences) => 
      updateNotificationPreferences(preferences),
    onSuccess: (updatedPreferences) => {
      queryClient.setQueryData<User | undefined>(
        userQueryKeys.profile,
        (oldData) => {
          if (!oldData) return undefined;
          return {
            ...oldData,
            notifications: updatedPreferences,
          };
        }
      );
      return updatedPreferences;
    },
  });
}

// Hook for updating password
export function useUpdatePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => 
      updatePassword(currentPassword, newPassword),
  });
}

// Hook for fetching payment methods
export function usePaymentMethods() {
  return useQuery({
    queryKey: userQueryKeys.paymentMethods,
    queryFn: fetchPaymentMethods,
  });
}

// Hook for adding a payment method
export function useAddPaymentMethod() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (paymentMethodData: any) => addPaymentMethod(paymentMethodData),
    onSuccess: (newPaymentMethod) => {
      queryClient.setQueryData<PaymentMethod[]>(
        userQueryKeys.paymentMethods,
        (oldData = []) => [...oldData, newPaymentMethod]
      );
      return newPaymentMethod;
    },
  });
}

// Hook for deleting a payment method
export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deletePaymentMethod(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<PaymentMethod[]>(
        userQueryKeys.paymentMethods,
        (oldData = []) => oldData.filter((method) => method.id !== deletedId)
      );
    },
  });
}

// Hook for setting default payment method
export function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => setDefaultPaymentMethod(id),
    onSuccess: (updatedMethods) => {
      queryClient.setQueryData(userQueryKeys.paymentMethods, updatedMethods);
      return updatedMethods;
    },
  });
}

// Hook for fetching retailer profile
export function useRetailerProfile() {
  return useQuery({
    queryKey: userQueryKeys.retailerProfile,
    queryFn: fetchRetailerProfile,
    // Only fetch if the user is a retailer
    enabled: false, // This will be manually enabled in the component when we know the user is a retailer
  });
}

// Hook for updating retailer profile
export function useUpdateRetailerProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<RetailerProfile>) => updateRetailerProfile(data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(userQueryKeys.retailerProfile, updatedProfile);
      
      // Also update the retailer profile in the user data if it exists
      queryClient.setQueryData<User | undefined>(
        userQueryKeys.profile,
        (oldData) => {
          if (!oldData) return undefined;
          return {
            ...oldData,
            retailerProfile: updatedProfile,
          };
        }
      );
      
      return updatedProfile;
    },
  });
}