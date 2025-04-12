/**
 * API Error handler utility
 * Provides consistent error handling for API requests
 */

import { AxiosError } from 'axios';

export interface ApiErrorResponse {
  status: number;
  message: string;
  details?: any;
}

/**
 * Format error from API calls into a consistent structure
 * @param error Any error from API call
 * @returns Formatted API error response
 */
export function formatApiError(error: unknown): ApiErrorResponse {
  // Handle Axios errors
  if (error instanceof AxiosError) {
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message,
      details: error.response?.data
    };
  }
  
  // Handle standard errors
  if (error instanceof Error) {
    return {
      status: 500,
      message: error.message
    };
  }
  
  // Handle unknown errors
  return {
    status: 500,
    message: 'An unknown error occurred',
    details: error
  };
}

/**
 * Log API error with consistent format
 * @param context Context where the error occurred (e.g., 'DHL.createShipment')
 * @param error The error object
 */
export function logApiError(context: string, error: unknown): void {
  const formattedError = formatApiError(error);
  console.error(
    `Error in ${context}: [${formattedError.status}] ${formattedError.message}`,
    formattedError.details || ''
  );
}