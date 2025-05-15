import { 
  setCookie, 
  getCookie, 
  removeCookie, 
  hasCookie, 
  COOKIE_NAMES,
  setLanguagePreference,
  getLanguagePreference,
  setThemePreference,
  getThemePreference,
  addProductToRecentlyViewed,
  getRecentlyViewedProducts,
} from './cookies';

// Mock the js-cookie library
jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));

import Cookies from 'js-cookie';

describe('Cookie utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setCookie', () => {
    it('should set a string cookie value correctly', () => {
      setCookie('test_cookie', 'test_value');
      expect(Cookies.set).toHaveBeenCalledWith('test_cookie', 'test_value', expect.any(Object));
    });

    it('should stringify object values', () => {
      const testObject = { foo: 'bar', baz: 123 };
      setCookie('test_object', testObject);
      expect(Cookies.set).toHaveBeenCalledWith('test_object', JSON.stringify(testObject), expect.any(Object));
    });

    it('should apply custom options', () => {
      const customOptions = { expires: 7, path: '/custom' };
      setCookie('test_options', 'value', customOptions);
      
      expect(Cookies.set).toHaveBeenCalledWith(
        'test_options', 
        'value', 
        expect.objectContaining(customOptions)
      );
    });
  });

  describe('getCookie', () => {
    it('should return cookie value when available', () => {
      (Cookies.get as jest.Mock).mockReturnValue('test_value');
      
      const result = getCookie('test_cookie');
      
      expect(Cookies.get).toHaveBeenCalledWith('test_cookie');
      expect(result).toBe('test_value');
    });

    it('should return null when cookie not found', () => {
      (Cookies.get as jest.Mock).mockReturnValue(undefined);
      
      const result = getCookie('nonexistent_cookie');
      
      expect(result).toBeNull();
    });

    it('should parse JSON cookie data when requested', () => {
      const jsonString = JSON.stringify({ foo: 'bar', baz: 123 });
      (Cookies.get as jest.Mock).mockReturnValue(jsonString);
      
      const result = getCookie('json_cookie', true);
      
      expect(result).toEqual({ foo: 'bar', baz: 123 });
    });

    it('should handle invalid JSON when parsing is requested', () => {
      console.error = jest.fn();
      (Cookies.get as jest.Mock).mockReturnValue('invalid-json');
      
      const result = getCookie('invalid_json', true);
      
      expect(console.error).toHaveBeenCalled();
      expect(result).toBe('invalid-json');
    });
  });

  describe('removeCookie', () => {
    it('should remove a cookie', () => {
      removeCookie('test_cookie');
      
      expect(Cookies.remove).toHaveBeenCalledWith('test_cookie', expect.any(Object));
    });

    it('should apply custom options', () => {
      const customOptions = { path: '/custom' };
      removeCookie('test_cookie', customOptions);
      
      expect(Cookies.remove).toHaveBeenCalledWith(
        'test_cookie', 
        expect.objectContaining(customOptions)
      );
    });
  });

  describe('hasCookie', () => {
    it('should return true when cookie exists', () => {
      (Cookies.get as jest.Mock).mockReturnValue('value');
      
      const result = hasCookie('existing_cookie');
      
      expect(result).toBe(true);
    });

    it('should return false when cookie does not exist', () => {
      (Cookies.get as jest.Mock).mockReturnValue(undefined);
      
      const result = hasCookie('nonexistent_cookie');
      
      expect(result).toBe(false);
    });
  });

  describe('Language preference functions', () => {
    it('should set language preference cookie', () => {
      setLanguagePreference('fr');
      
      expect(Cookies.set).toHaveBeenCalledWith(
        COOKIE_NAMES.LANGUAGE_PREFERENCE,
        'fr',
        expect.any(Object)
      );
    });

    it('should get language preference with default fallback', () => {
      (Cookies.get as jest.Mock).mockReturnValue(undefined);
      
      const result = getLanguagePreference();
      
      expect(result).toBe('en');
    });

    it('should get custom language preference', () => {
      (Cookies.get as jest.Mock).mockReturnValue('de');
      
      const result = getLanguagePreference();
      
      expect(result).toBe('de');
    });
  });

  describe('Theme preference functions', () => {
    it('should set theme preference cookie', () => {
      setThemePreference('dark');
      
      expect(Cookies.set).toHaveBeenCalledWith(
        COOKIE_NAMES.THEME_PREFERENCE,
        'dark',
        expect.any(Object)
      );
    });

    it('should get theme preference with default fallback', () => {
      (Cookies.get as jest.Mock).mockReturnValue(undefined);
      
      const result = getThemePreference();
      
      expect(result).toBe('system');
    });

    it('should get custom theme preference', () => {
      (Cookies.get as jest.Mock).mockReturnValue('light');
      
      const result = getThemePreference();
      
      expect(result).toBe('light');
    });
  });

  describe('Recently viewed products functions', () => {
    it('should add a product to recently viewed', () => {
      (Cookies.get as jest.Mock).mockReturnValue(JSON.stringify(['product2', 'product3']));
      
      addProductToRecentlyViewed('product1');
      
      // Check that setCookie was called with the new product at the beginning
      expect(Cookies.set).toHaveBeenCalledWith(
        COOKIE_NAMES.RECENTLY_VIEWED_PRODUCTS,
        JSON.stringify(['product1', 'product2', 'product3']),
        expect.any(Object)
      );
    });

    it('should handle adding a duplicate product (should move to front)', () => {
      (Cookies.get as jest.Mock).mockReturnValue(JSON.stringify(['product1', 'product2', 'product3']));
      
      addProductToRecentlyViewed('product2');
      
      // Check that product2 moved to the front
      expect(Cookies.set).toHaveBeenCalledWith(
        COOKIE_NAMES.RECENTLY_VIEWED_PRODUCTS,
        JSON.stringify(['product2', 'product1', 'product3']),
        expect.any(Object)
      );
    });

    it('should limit the number of products', () => {
      (Cookies.get as jest.Mock).mockReturnValue(JSON.stringify(['product2', 'product3', 'product4', 'product5']));
      
      addProductToRecentlyViewed('product1', 3);
      
      // Check that only 3 products are kept
      expect(Cookies.set).toHaveBeenCalledWith(
        COOKIE_NAMES.RECENTLY_VIEWED_PRODUCTS,
        JSON.stringify(['product1', 'product2', 'product3']),
        expect.any(Object)
      );
    });

    it('should get recently viewed products', () => {
      const products = ['product1', 'product2', 'product3'];
      (Cookies.get as jest.Mock).mockReturnValue(JSON.stringify(products));
      
      const result = getRecentlyViewedProducts();
      
      expect(result).toEqual(products);
    });

    it('should return empty array if no products cookie exists', () => {
      (Cookies.get as jest.Mock).mockReturnValue(undefined);
      
      const result = getRecentlyViewedProducts();
      
      expect(result).toEqual([]);
    });
  });
}); 