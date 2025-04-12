// Types for order data
export interface Order {
  id: string;
  date: string;
  total: number;
  status: OrderStatus;
  items: OrderItem[];
  trackingNumber: string | null;
  trackingUrl?: string;
  deliveryAddress: string;
  paymentMethod: string;
  retailerId?: string;
  notes?: string;
  customerEmail?: string;
  metadata?: Record<string, any>;
  estimatedDeliveryDate?: string;
}

export type OrderStatus = 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  productId: string;
  imageUrl?: string;
  rating?: number;
  reviewId?: string;
}

// Fetch user orders
export async function fetchOrders(): Promise<Order[]> {
  const response = await fetch('/api/user/orders');
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to fetch orders');
  }
  
  return response.json();
}

// Fetch order details by ID
export async function fetchOrderById(orderId: string): Promise<Order> {
  const response = await fetch(`/api/user/orders/${orderId}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to fetch order details');
  }
  
  return response.json();
}

// Cancel an order
export async function cancelOrder(orderId: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`/api/user/orders/${orderId}/cancel`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to cancel order');
  }
  
  return response.json();
}

// Track an order
export async function trackOrder(trackingNumber: string): Promise<{ 
  trackingUrl: string;
  status: string;
  updates: Array<{ date: string; status: string; location: string }>;
}> {
  const response = await fetch(`/api/tracking/${trackingNumber}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to fetch tracking information');
  }
  
  return response.json();
}

// For retailers: Get orders placed with this retailer
export async function fetchRetailerOrders(): Promise<Order[]> {
  const response = await fetch('/api/retailer/orders');
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to fetch retailer orders');
  }
  
  return response.json();
}

// For retailers: Update order status
export async function updateOrderStatus(
  orderId: string, 
  status: OrderStatus, 
  trackingNumber?: string
): Promise<Order> {
  const response = await fetch(`/api/retailer/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, trackingNumber }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to update order status');
  }
  
  return response.json();
}

// Reorder from a previous order
export async function reorderFromPreviousOrder(orderId: string): Promise<{ 
  success: boolean;
  message: string; 
  newOrderId?: string;
}> {
  const response = await fetch(`/api/user/orders/${orderId}/reorder`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to create new order from previous order');
  }
  
  return response.json();
}

// Get order invoice
export async function getOrderInvoice(orderId: string): Promise<Blob> {
  const response = await fetch(`/api/user/orders/${orderId}/invoice`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to fetch invoice');
  }
  
  return response.blob();
}

// Email invoice to customer
export async function emailOrderInvoice(orderId: string, email?: string): Promise<{ 
  success: boolean; 
  message: string;
}> {
  const response = await fetch(`/api/user/orders/${orderId}/email-invoice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to email invoice');
  }
  
  return response.json();
}

// Add/update order notes
export async function updateOrderNotes(orderId: string, notes: string): Promise<Order> {
  const response = await fetch(`/api/user/orders/${orderId}/notes`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ notes }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to update order notes');
  }
  
  return response.json();
}

// Rate a product from an order
export async function rateOrderItem(
  orderId: string, 
  itemId: string, 
  rating: number, 
  review?: string
): Promise<{ 
  success: boolean; 
  message: string; 
  reviewId?: string;
}> {
  const response = await fetch(`/api/user/orders/${orderId}/items/${itemId}/rate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rating, review }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to rate product');
  }
  
  return response.json();
}

// Get order history
export async function getOrderHistory(orderId: string): Promise<Array<{ 
  date: string; 
  status: OrderStatus; 
  note?: string;
  userId?: string;
}>> {
  const response = await fetch(`/api/user/orders/${orderId}/history`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to fetch order history');
  }
  
  return response.json();
}