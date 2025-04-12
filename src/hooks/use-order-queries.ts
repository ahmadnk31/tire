"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Order,
  OrderStatus,
  fetchOrders,
  fetchOrderById,
  cancelOrder,
  trackOrder,
  fetchRetailerOrders,
  updateOrderStatus,
  reorderFromPreviousOrder,
  getOrderInvoice,
  emailOrderInvoice,
  updateOrderNotes,
  rateOrderItem,
  getOrderHistory
} from "@/lib/api/order-api";

// Query keys for caching
export const orderQueryKeys = {
  all: ["orders"],
  detail: (id: string) => ["orders", id],
  retailer: ["retailer", "orders"],
  tracking: (number: string) => ["tracking", number],
  history: (id: string) => ["orders", id, "history"],
};

// Hook for fetching all user orders
export function useOrders() {
  return useQuery({
    queryKey: orderQueryKeys.all,
    queryFn: fetchOrders,
  });
}

// Hook for fetching a specific order by ID
export function useOrderDetails(orderId: string) {
  return useQuery({
    queryKey: orderQueryKeys.detail(orderId),
    queryFn: () => fetchOrderById(orderId),
    enabled: !!orderId, // Only run the query if an orderId is provided
  });
}

// Hook for cancelling an order
export function useCancelOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId),
    onSuccess: (_, orderId) => {
      // Update the orders list
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.all });
      
      // Update the specific order detail if it's in cache
      queryClient.invalidateQueries({
        queryKey: orderQueryKeys.detail(orderId),
      });
    },
  });
}

// Hook for tracking an order
export function useTrackOrder(trackingNumber: string) {
  return useQuery({
    queryKey: orderQueryKeys.tracking(trackingNumber),
    queryFn: () => trackOrder(trackingNumber),
    enabled: !!trackingNumber, // Only run the query if a tracking number is provided
  });
}

// Hook for fetching orders placed with the retailer (for retailer accounts)
export function useRetailerOrders() {
  return useQuery({
    queryKey: orderQueryKeys.retailer,
    queryFn: fetchRetailerOrders,
  });
}

// Hook for updating order status (for retailer accounts)
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      orderId, 
      status, 
      trackingNumber 
    }: { 
      orderId: string; 
      status: OrderStatus; 
      trackingNumber?: string;
    }) => updateOrderStatus(orderId, status, trackingNumber),
    onSuccess: (updatedOrder) => {
      // Update retailer orders list
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.retailer });
      
      // Update specific order detail if it's in cache
      queryClient.invalidateQueries({
        queryKey: orderQueryKeys.detail(updatedOrder.id),
      });
    },
  });
}

// Hook for reordering from a previous order
export function useReorder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderId: string) => reorderFromPreviousOrder(orderId),
    onSuccess: () => {
      // After reordering, update the orders list
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.all });
    },
  });
}

// Hook for downloading an order invoice
export function useOrderInvoice(orderId: string) {
  return useQuery({
    queryKey: [...orderQueryKeys.detail(orderId), "invoice"],
    queryFn: () => getOrderInvoice(orderId),
    enabled: !!orderId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for emailing an invoice
export function useEmailInvoice() {
  return useMutation({
    mutationFn: ({ 
      orderId, 
      email 
    }: { 
      orderId: string; 
      email?: string;
    }) => emailOrderInvoice(orderId, email),
  });
}

// Hook for updating order notes
export function useUpdateOrderNotes() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      orderId, 
      notes 
    }: { 
      orderId: string; 
      notes: string;
    }) => updateOrderNotes(orderId, notes),
    onSuccess: (updatedOrder) => {
      // Update the orders list
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.all });
      
      // Update the specific order detail if it's in cache
      queryClient.invalidateQueries({
        queryKey: orderQueryKeys.detail(updatedOrder.id),
      });
    },
  });
}

// Hook for rating an order item
export function useRateOrderItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      orderId, 
      itemId, 
      rating, 
      review 
    }: { 
      orderId: string; 
      itemId: string; 
      rating: number; 
      review?: string;
    }) => rateOrderItem(orderId, itemId, rating, review),
    onSuccess: (_, { orderId }) => {
      // Update the specific order detail if it's in cache
      queryClient.invalidateQueries({
        queryKey: orderQueryKeys.detail(orderId),
      });
    },
  });
}

// Hook for fetching order history
export function useOrderHistory(orderId: string) {
  return useQuery({
    queryKey: orderQueryKeys.history(orderId),
    queryFn: () => getOrderHistory(orderId),
    enabled: !!orderId,
  });
}