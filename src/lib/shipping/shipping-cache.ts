import { RateQuote, RateRequest } from './shipping-interfaces';

/**
 * Simple in-memory cache for shipping rates
 * Caches rates by address pairs and package dimensions
 */
export class ShippingRateCache {
  private static cache: Map<string, { rates: RateQuote[], timestamp: number }> = new Map();
  
  // Default TTL of 1 hour (in milliseconds)
  private static readonly TTL = 60 * 60 * 1000;
  
  /**
   * Generate a cache key from a rate request
   */
  private static generateKey(request: RateRequest): string {
    // Create a key based on origin, destination, and package dimensions
    const origin = `${request.shipperAddress.postalCode}-${request.shipperAddress.countryCode}`;
    const destination = `${request.recipientAddress.postalCode}-${request.recipientAddress.countryCode}`;
    
    // Hash packages data into a consistent format for the key
    const packagesHash = request.packages
      .map(pkg => `${pkg.weight}-${pkg.length}-${pkg.width}-${pkg.height}`)
      .sort()
      .join('|');
    
    return `${origin}:${destination}:${packagesHash}:${request.serviceType || 'all'}`;
  }
  
  /**
   * Store rates in cache
   */
  public static cacheRates(request: RateRequest, rates: RateQuote[]): void {
    const key = this.generateKey(request);
    this.cache.set(key, {
      rates,
      timestamp: Date.now()
    });
  }
  
  /**
   * Get rates from cache if available and not expired
   * @returns Cached rates or null if not in cache or expired
   */
  public static getCachedRates(request: RateRequest): RateQuote[] | null {
    const key = this.generateKey(request);
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache has expired
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.rates;
  }
  
  /**
   * Clear the entire cache
   */
  public static clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Remove expired items from cache
   */
  public static cleanupExpiredItems(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }
}