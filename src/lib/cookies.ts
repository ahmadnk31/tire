import Cookies from 'js-cookie';

/**
 * Constants for cookie names to avoid typos and ensure consistency
 */
export const COOKIE_NAMES = {
  LANGUAGE_PREFERENCE: 'language_preference',
  THEME_PREFERENCE: 'theme_preference',
  CONSENT_GIVEN: 'consent_given',
  LAST_VISITED: 'last_visited',
  RECENTLY_VIEWED_PRODUCTS: 'recently_viewed_products',
  USER_PREFERENCES: 'user_preferences',
  SHOPPING_CART: 'shopping_cart',
  SESSION_ID: 'session_id',
};

/**
 * Default options for cookies
 */
const DEFAULT_OPTIONS = {
  // 30 days expiry by default
  expires: 30,
  path: '/',
  // Only accessible via HTTP, not JavaScript (helps with XSS)
  sameSite: 'strict' as const,
  // Use secure cookies in production
  secure: process.env.NODE_ENV === 'production',
};

/**
 * Set a cookie with the given name and value
 * 
 * @param name Cookie name
 * @param value Cookie value
 * @param options Cookie options (optional)
 */
export function setCookie(name: string, value: string | object, options = {}) {
  if (typeof value === 'object') {
    value = JSON.stringify(value);
  }
  
  Cookies.set(name, value, { ...DEFAULT_OPTIONS, ...options });
}

/**
 * Get a cookie value by name
 * 
 * @param name Cookie name
 * @param parseJson Whether to parse the value as JSON
 * @returns The cookie value or null if not found
 */
export function getCookie(name: string, parseJson = false): string | object | null {
  const value = Cookies.get(name);
  
  if (!value) {
    return null;
  }
  
  if (parseJson) {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.error(`Error parsing cookie ${name} as JSON`, error);
      return value;
    }
  }
  
  return value;
}

/**
 * Remove a cookie by name
 * 
 * @param name Cookie name
 * @param options Cookie options (optional)
 */
export function removeCookie(name: string, options = {}) {
  Cookies.remove(name, { ...options, path: options.path || DEFAULT_OPTIONS.path });
}

/**
 * Check if a cookie exists
 * 
 * @param name Cookie name
 * @returns boolean indicating if the cookie exists
 */
export function hasCookie(name: string): boolean {
  return getCookie(name) !== null;
}

/**
 * Set consent cookie
 * 
 * @param consented Whether the user has consented
 * @param options Cookie options (optional)
 */
export function setConsentCookie(consented: boolean, options = {}) {
  setCookie(COOKIE_NAMES.CONSENT_GIVEN, consented.toString(), options);
}

/**
 * Check if the user has given consent
 * 
 * @returns boolean indicating consent status
 */
export function hasConsent(): boolean {
  return getCookie(COOKIE_NAMES.CONSENT_GIVEN) === 'true';
}

/**
 * Save recently viewed products
 * 
 * @param productIds Array of product IDs
 * @param maxItems Maximum number of items to store (default: 10)
 */
export function saveRecentlyViewedProducts(productIds: string[], maxItems = 10) {
  // Limit the number of items
  const limitedIds = productIds.slice(0, maxItems);
  
  setCookie(COOKIE_NAMES.RECENTLY_VIEWED_PRODUCTS, limitedIds);
}

/**
 * Get recently viewed products
 * 
 * @returns Array of product IDs or empty array if none
 */
export function getRecentlyViewedProducts(): string[] {
  const products = getCookie(COOKIE_NAMES.RECENTLY_VIEWED_PRODUCTS, true);
  
  if (Array.isArray(products)) {
    return products;
  }
  
  return [];
}

/**
 * Add a product to recently viewed
 * 
 * @param productId Product ID to add
 * @param maxItems Maximum number of items to store (default: 10)
 */
export function addProductToRecentlyViewed(productId: string, maxItems = 10) {
  const currentProducts = getRecentlyViewedProducts();
  
  // Remove the product if it already exists (to avoid duplicates)
  const filteredProducts = currentProducts.filter(id => id !== productId);
  
  // Add the new product to the beginning of the array
  const updatedProducts = [productId, ...filteredProducts];
  
  saveRecentlyViewedProducts(updatedProducts, maxItems);
}

/**
 * Set user language preference
 * 
 * @param language Language code (e.g., 'en', 'es', 'fr')
 */
export function setLanguagePreference(language: string) {
  setCookie(COOKIE_NAMES.LANGUAGE_PREFERENCE, language);
}

/**
 * Get user language preference
 * 
 * @param defaultLang Default language to return if preference not found
 * @returns Language code
 */
export function getLanguagePreference(defaultLang = 'en'): string {
  return getCookie(COOKIE_NAMES.LANGUAGE_PREFERENCE) as string || defaultLang;
}

/**
 * Set theme preference
 * 
 * @param theme Theme name ('light', 'dark', or 'system')
 */
export function setThemePreference(theme: 'light' | 'dark' | 'system') {
  setCookie(COOKIE_NAMES.THEME_PREFERENCE, theme);
}

/**
 * Get theme preference
 * 
 * @param defaultTheme Default theme to return if preference not found
 * @returns Theme name
 */
export function getThemePreference(defaultTheme = 'system'): 'light' | 'dark' | 'system' {
  return (getCookie(COOKIE_NAMES.THEME_PREFERENCE) as string || defaultTheme) as 'light' | 'dark' | 'system';
}

/**
 * Set user preferences (generic function for storing user preferences)
 * 
 * @param preferences Object containing user preferences
 */
export function setUserPreferences(preferences: Record<string, any>) {
  setCookie(COOKIE_NAMES.USER_PREFERENCES, preferences);
}

/**
 * Get user preferences
 * 
 * @returns User preferences object or empty object if not found
 */
export function getUserPreferences(): Record<string, any> {
  const preferences = getCookie(COOKIE_NAMES.USER_PREFERENCES, true);
  
  if (preferences && typeof preferences === 'object') {
    return preferences as Record<string, any>;
  }
  
  return {};
}

/**
 * Update user preferences
 * 
 * @param key Preference key to update
 * @param value New value
 */
export function updateUserPreference(key: string, value: any) {
  const currentPreferences = getUserPreferences();
  
  setUserPreferences({
    ...currentPreferences,
    [key]: value,
  });
}

/**
 * Record the current time as last visited timestamp
 */
export function recordVisit() {
  setCookie(COOKIE_NAMES.LAST_VISITED, new Date().toISOString());
}

/**
 * Get last visited timestamp
 * 
 * @returns Date object of last visit or null if not available
 */
export function getLastVisited(): Date | null {
  const lastVisited = getCookie(COOKIE_NAMES.LAST_VISITED) as string;
  
  if (lastVisited) {
    try {
      return new Date(lastVisited);
    } catch (error) {
      console.error('Error parsing last visited date', error);
      return null;
    }
  }
  
  return null;
}

/**
 * Set shopping cart cookie
 * 
 * @param cart Cart object
 */
export function setShoppingCartCookie(cart: Record<string, any>) {
  setCookie(COOKIE_NAMES.SHOPPING_CART, cart);
}

/**
 * Get shopping cart from cookie
 * 
 * @returns Shopping cart object or empty object if not found
 */
export function getShoppingCartCookie(): Record<string, any> {
  const cart = getCookie(COOKIE_NAMES.SHOPPING_CART, true);
  
  if (cart && typeof cart === 'object') {
    return cart as Record<string, any>;
  }
  
  return {};
} 