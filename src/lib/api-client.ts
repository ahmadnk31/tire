import axios from 'axios';

// Create an axios instance with common configuration
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  avatar?: string;
  notifications: {
    email: boolean;
    sms: boolean;
    promotions: boolean;
    orderUpdates: boolean;
    newsletter: boolean;
  };
}

export interface ProfileUpdateData {
  name?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  promotions: boolean;
  orderUpdates: boolean;
  newsletter: boolean;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
}

// User profile
export const getUserProfile = async (): Promise<UserProfile> => {
  const response = await api.get('/user/profile');
  return response.data;
};

export const updateUserProfile = async (data: ProfileUpdateData): Promise<UserProfile> => {
  const response = await api.patch('/user/profile', data);
  return response.data;
};

export const updateUserAvatar = async (file: File): Promise<{ avatarUrl: string }> => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  const response = await api.post('/user/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

// Notification preferences
export const updateNotificationPreferences = async (
  preferences: NotificationPreferences
): Promise<NotificationPreferences> => {
  const response = await api.patch('/user/notifications', preferences);
  return response.data;
};

// Payment methods
export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const response = await api.get('/user/payment-methods');
  return response.data;
};

export const deletePaymentMethod = async (id: string): Promise<void> => {
  await api.delete(`/user/payment-methods/${id}`);
};

export const setDefaultPaymentMethod = async (id: string): Promise<void> => {
  await api.patch(`/user/payment-methods/${id}/default`);
};

// Interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error cases here (e.g., 401 for auth, etc.)
    const errorMessage = error.response?.data?.message || 'An unexpected error occurred';
    
    // You could dispatch to an error tracking service here
    console.error('API Error:', errorMessage);
    
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;