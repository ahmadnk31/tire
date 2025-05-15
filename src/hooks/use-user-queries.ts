"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  User,
  UserNotificationPreferences,
  PaymentMethod,
  RetailerProfile,
  UserAddress,
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
  fetchUserAddresses,
  fetchUserAddress,
  createUserAddress,
  updateUserAddress,
  deleteUserAddress,
} from "@/lib/api/user-api";

// Query keys for caching
export const userQueryKeys = {
  profile: ["user", "profile"],
  notifications: ["user", "notifications"],
  paymentMethods: ["user", "payment-methods"],
  retailerProfile: ["user", "retailer-profile"],
  addresses: ["user", "addresses"],
  address: (id: string) => ["user", "addresses", id],
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

// Hook for fetching all user addresses
export function useUserAddresses() {
  return useQuery({
    queryKey: userQueryKeys.addresses,
    queryFn: fetchUserAddresses,
  });
}

// Hook for fetching a specific address
export function useUserAddress(id: string) {
  return useQuery({
    queryKey: userQueryKeys.address(id),
    queryFn: () => fetchUserAddress(id),
    enabled: !!id, // Only fetch when ID is provided
  });
}

// Hook for creating a new address
export function useCreateUserAddress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (addressData: Partial<UserAddress>) => createUserAddress(addressData),
    onSuccess: (newAddress) => {
      queryClient.setQueryData<UserAddress[]>(
        userQueryKeys.addresses,
        (oldAddresses = []) => [...oldAddresses, newAddress]
      );
      return newAddress;
    },
  });
}

// Hook for updating an address
export function useUpdateUserAddress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserAddress> }) => 
      updateUserAddress(id, data),
    onSuccess: (updatedAddress) => {
      // Update in the list of addresses
      queryClient.setQueryData<UserAddress[]>(
        userQueryKeys.addresses,
        (oldAddresses = []) => oldAddresses.map(addr => 
          addr.id === updatedAddress.id ? updatedAddress : addr
        )
      );
      
      // Update the individual address cache
      queryClient.setQueryData(
        userQueryKeys.address(updatedAddress.id),
        updatedAddress
      );
      
      return updatedAddress;
    },
  });
}

// Hook for deleting an address
export function useDeleteUserAddress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteUserAddress(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<UserAddress[]>(
        userQueryKeys.addresses,
        (oldAddresses = []) => oldAddresses.filter(addr => addr.id !== deletedId)
      );
      queryClient.removeQueries({ queryKey: userQueryKeys.address(deletedId) });
    },
  });
}