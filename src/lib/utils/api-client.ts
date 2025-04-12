/**
 * Type-safe API client for making requests to our backend
 */

// API response type
interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

// Default fetch options
const defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Include cookies for authentication
};

/**
 * Make a GET request to the API
 * @param url API endpoint URL
 * @param options Optional fetch options
 * @returns Promise with typed response data
 */
export async function apiGet<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      method: 'GET',
    });
    
    if (response.ok) {
      const data = await response.json();
      return { data, status: response.status };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return { 
        error: errorData.error || 'An error occurred', 
        status: response.status 
      };
    }
  } catch (error) {
    console.error('API error:', error);
    return {
      error: 'Network error',
      status: 500,
    };
  }
}

/**
 * Make a POST request to the API
 * @param url API endpoint URL
 * @param data Data to send in the request body
 * @param options Optional fetch options
 * @returns Promise with typed response data
 */
export async function apiPost<T, D = any>(url: string, data: D, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response.ok) {
      const responseData = await response.json();
      return { data: responseData, status: response.status };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return { 
        error: errorData.error || 'An error occurred', 
        status: response.status 
      };
    }
  } catch (error) {
    console.error('API error:', error);
    return {
      error: 'Network error',
      status: 500,
    };
  }
}

/**
 * Make a PATCH request to the API
 * @param url API endpoint URL
 * @param data Data to send in the request body
 * @param options Optional fetch options
 * @returns Promise with typed response data
 */
export async function apiPatch<T, D = any>(url: string, data: D, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    
    if (response.ok) {
      const responseData = await response.json();
      return { data: responseData, status: response.status };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return { 
        error: errorData.error || 'An error occurred', 
        status: response.status 
      };
    }
  } catch (error) {
    console.error('API error:', error);
    return {
      error: 'Network error',
      status: 500,
    };
  }
}

/**
 * Make a DELETE request to the API
 * @param url API endpoint URL
 * @param options Optional fetch options
 * @returns Promise with typed response data
 */
export async function apiDelete<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      method: 'DELETE',
    });
    
    if (response.ok) {
      const data = await response.json();
      return { data, status: response.status };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return { 
        error: errorData.error || 'An error occurred', 
        status: response.status 
      };
    }
  } catch (error) {
    console.error('API error:', error);
    return {
      error: 'Network error',
      status: 500,
    };
  }
}