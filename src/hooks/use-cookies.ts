import { useState, useEffect, useCallback } from 'react';
import { 
  setCookie, 
  getCookie, 
  removeCookie, 
  hasCookie 
} from '@/lib/cookies';

/**
 * Hook for working with cookies in React components
 * 
 * @param key The cookie name
 * @param initialValue The initial value if cookie doesn't exist
 * @param options Additional cookie options
 * @returns A tuple with cookie value, setter function, and removal function
 */
export function useCookie<T>(
  key: string, 
  initialValue: T,
  options = {}
): [T, (value: T, options?: object) => void, () => void] {
  // Get the initial cookie value
  const getCookieValue = useCallback(() => {
    try {
      // First try to get the cookie
      const item = getCookie(key);
      
      // Parse stored json or return initialValue if no cookie found
      if (item) {
        try {
          // Try to parse as JSON first
          return JSON.parse(item as string) as T;
        } catch {
          // If it's not JSON, return as is
          return item as unknown as T;
        }
      }
      
      return initialValue;
    } catch (error) {
      console.error(`Error reading cookie ${key}:`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(getCookieValue);

  // Return a wrapped version of useState's setter function
  const setValue = useCallback((value: T, overrideOptions = {}) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to cookie
      setCookie(key, valueToStore, { ...options, ...overrideOptions });
    } catch (error) {
      console.error(`Error setting cookie ${key}:`, error);
    }
  }, [key, options, storedValue]);

  // Function to remove the cookie
  const removeCookieValue = useCallback(() => {
    try {
      // Reset state to initial value
      setStoredValue(initialValue);
      
      // Remove the cookie
      removeCookie(key);
    } catch (error) {
      console.error(`Error removing cookie ${key}:`, error);
    }
  }, [key, initialValue]);

  // Listen for changes to the cookie from other tabs/windows
  useEffect(() => {
    // Update state if cookie changes from outside
    const syncCookieValue = () => {
      if (hasCookie(key)) {
        setStoredValue(getCookieValue());
      } else {
        setStoredValue(initialValue);
      }
    };

    // Sync with other tabs
    window.addEventListener('storage', syncCookieValue);
    
    return () => {
      window.removeEventListener('storage', syncCookieValue);
    };
  }, [key, initialValue, getCookieValue]);

  return [storedValue, setValue, removeCookieValue];
}

/**
 * Hook for working with recent products stored in cookies
 * 
 * @param maxItems Maximum number of items to store (default: 10)
 * @returns Functions to work with recently viewed products
 */
export function useRecentProducts(maxItems = 10) {
  // Get recently viewed products from cookies
  const getRecentProducts = useCallback(() => {
    const recentProducts = getCookie('recently_viewed_products', true);
    
    if (Array.isArray(recentProducts)) {
      return recentProducts as string[];
    }
    
    return [];
  }, []);

  // State to store recently viewed products
  const [recentProducts, setRecentProducts] = useState<string[]>(getRecentProducts());

  // Function to add a product to recently viewed
  const addProduct = useCallback((productId: string) => {
    setRecentProducts(prev => {
      // Remove the product if it already exists (to avoid duplicates)
      const filteredProducts = prev.filter(id => id !== productId);
      
      // Add the new product to the beginning of the array
      const updatedProducts = [productId, ...filteredProducts].slice(0, maxItems);
      
      // Save to cookie
      setCookie('recently_viewed_products', updatedProducts);
      
      return updatedProducts;
    });
  }, [maxItems]);

  // Function to clear recently viewed products
  const clearProducts = useCallback(() => {
    setRecentProducts([]);
    removeCookie('recently_viewed_products');
  }, []);

  // Listen for changes to the cookie from other tabs/windows
  useEffect(() => {
    // Update state if cookie changes from outside
    const syncCookieValue = () => {
      setRecentProducts(getRecentProducts());
    };

    // Sync with other tabs
    window.addEventListener('storage', syncCookieValue);
    
    return () => {
      window.removeEventListener('storage', syncCookieValue);
    };
  }, [getRecentProducts]);

  return {
    recentProducts,
    addProduct,
    clearProducts
  };
}

/**
 * Hook for working with user preferences stored in cookies
 * 
 * @returns Functions to work with user preferences
 */
export function useUserPreferences() {
  // Get user preferences from cookies
  const getUserPrefs = useCallback(() => {
    const preferences = getCookie('user_preferences', true);
    
    if (preferences && typeof preferences === 'object') {
      return preferences as Record<string, any>;
    }
    
    return {};
  }, []);

  // State to store user preferences
  const [preferences, setPreferences] = useState<Record<string, any>>(getUserPrefs());

  // Function to update a user preference
  const updatePreference = useCallback((key: string, value: any) => {
    setPreferences(prev => {
      const updatedPreferences = {
        ...prev,
        [key]: value,
      };
      
      // Save to cookie
      setCookie('user_preferences', updatedPreferences);
      
      return updatedPreferences;
    });
  }, []);

  // Function to clear user preferences
  const clearPreferences = useCallback(() => {
    setPreferences({});
    removeCookie('user_preferences');
  }, []);

  // Listen for changes to the cookie from other tabs/windows
  useEffect(() => {
    // Update state if cookie changes from outside
    const syncCookieValue = () => {
      setPreferences(getUserPrefs());
    };

    // Sync with other tabs
    window.addEventListener('storage', syncCookieValue);
    
    return () => {
      window.removeEventListener('storage', syncCookieValue);
    };
  }, [getUserPrefs]);

  return {
    preferences,
    updatePreference,
    clearPreferences
  };
} 