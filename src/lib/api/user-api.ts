// Types for user data
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  phoneNumber: string;
  address: string;
  role: string;
  notifications: UserNotificationPreferences;
  retailerProfile?: RetailerProfile;
}

export interface UserNotificationPreferences {
  emailNotifications: boolean;
  orderUpdates: boolean;
  promotionalEmails: boolean;
  inventoryAlerts: boolean;
  priceChanges: boolean;
}

export interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export interface RetailerProfile {
  id: string;
  companyName: string;
  phone: string;
  businessAddress: string;
  taxId?: string;
  yearsInBusiness: string;
}

// Fetch user profile data
export async function fetchUserProfile(): Promise<User> {
  const response = await fetch('/api/user/profile');
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to fetch user profile');
  }
  return response.json();
}

// Update user profile data
export async function updateUserProfile(data: Partial<User>): Promise<User> {
  const response = await fetch('/api/user/profile', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to update user profile');
  }
  
  return response.json();
}

// Update user avatar
export async function updateUserAvatar(fileOrUrl: File | string): Promise<{ avatarUrl: string }> {
  let response;
  
  if (typeof fileOrUrl === 'string') {
    // If a string URL is provided, send it as JSON
    response = await fetch('/api/user/avatar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileUrl: fileOrUrl }),
    });
  } else {
    // Otherwise, handle as file upload with FormData
    const formData = new FormData();
    formData.append('avatar', fileOrUrl);
    
    response = await fetch('/api/user/avatar', {
      method: 'POST',
      body: formData,
    });
  }
  
  if (!response.ok) {
    throw new Error('Failed to update avatar');
  }
  
  return response.json();
}

// Update notification preferences
export async function updateNotificationPreferences(
  preferences: UserNotificationPreferences
): Promise<UserNotificationPreferences> {
  const response = await fetch('/api/user/notifications', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preferences),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to update notification preferences');
  }
  
  return response.json();
}

// Update password
export async function updatePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  const response = await fetch('/api/user/password', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to update password');
  }
  
  return response.json();
}

// Get payment methods
export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  const response = await fetch('/api/user/payment-methods');
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to fetch payment methods');
  }
  
  return response.json();
}

// Add payment method
export async function addPaymentMethod(paymentMethodData: any): Promise<PaymentMethod> {
  const response = await fetch('/api/user/payment-methods', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(paymentMethodData),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to add payment method');
  }
  
  return response.json();
}

// Delete payment method
export async function deletePaymentMethod(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/user/payment-methods?id=${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to delete payment method');
  }
  
  return response.json();
}

// Set default payment method
export async function setDefaultPaymentMethod(id: string): Promise<PaymentMethod[]> {
  const response = await fetch(`/api/user/payment-methods?id=${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isDefault: true }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to set default payment method');
  }
  
  // Refresh the payment methods list
  return fetchPaymentMethods();
}

// Fetch retailer profile
export async function fetchRetailerProfile(): Promise<RetailerProfile> {
  const response = await fetch('/api/user/retailer');
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to fetch retailer profile');
  }
  
  return response.json();
}

// Update retailer profile
export async function updateRetailerProfile(data: Partial<RetailerProfile>): Promise<RetailerProfile> {
  const response = await fetch('/api/user/retailer', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to update retailer profile');
  }
  
  return response.json();
}