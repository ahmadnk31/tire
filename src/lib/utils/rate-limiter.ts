/**
 * Simple rate limiter for API calls
 * Prevents overuse of shipping APIs
 */

type RateLimitBucket = {
  count: number;
  resetTime: number;
};

export class RateLimiter {
  private buckets: Map<string, RateLimitBucket> = new Map();
  private readonly defaultLimit: number;
  private readonly defaultWindow: number;
  private readonly limits: Record<string, number>;
  
  /**
   * Create a new rate limiter
   * @param defaultLimit Default requests per window
   * @param defaultWindow Default time window in ms
   * @param limits Custom limits for specific keys
   */
  constructor(
    defaultLimit: number = 100,
    defaultWindow: number = 60 * 1000, // 1 minute
    limits: Record<string, number> = {}
  ) {
    this.defaultLimit = defaultLimit;
    this.defaultWindow = defaultWindow;
    this.limits = limits;
  }
  
  /**
   * Attempt to use a rate-limited resource
   * @param key Resource key to limit (e.g., 'dhl:getRates')
   * @returns True if the call is allowed, false if rate-limited
   */
  public tryAcquire(key: string): boolean {
    const now = Date.now();
    const limit = this.limits[key] || this.defaultLimit;
    
    // Get or create bucket
    let bucket = this.buckets.get(key);
    
    // If bucket doesn't exist or window has expired, create a new one
    if (!bucket || now > bucket.resetTime) {
      bucket = {
        count: 0,
        resetTime: now + this.defaultWindow
      };
      this.buckets.set(key, bucket);
    }
    
    // Check if we're under limit
    if (bucket.count < limit) {
      bucket.count++;
      return true;
    }
    
    return false;
  }
  
  /**
   * Get remaining calls allowed for a key
   * @param key Resource key
   */
  public getRemainingCalls(key: string): number {
    const now = Date.now();
    const limit = this.limits[key] || this.defaultLimit;
    const bucket = this.buckets.get(key);
    
    if (!bucket || now > bucket.resetTime) {
      return limit;
    }
    
    return Math.max(0, limit - bucket.count);
  }
  
  /**
   * Get time until rate limit resets for a key (in milliseconds)
   * @param key Resource key
   */
  public getTimeToReset(key: string): number {
    const now = Date.now();
    const bucket = this.buckets.get(key);
    
    if (!bucket || now > bucket.resetTime) {
      return 0;
    }
    
    return Math.max(0, bucket.resetTime - now);
  }
  
  /**
   * Wait for a rate limit to become available
   * @param key Resource key
   * @param maxWaitTime Maximum time to wait in ms
   * @returns Promise that resolves when limit is available
   */
  public async waitForAvailability(
    key: string,
    maxWaitTime: number = 10000
  ): Promise<boolean> {
    // If rate limit is available now, return immediately
    if (this.tryAcquire(key)) {
      return true;
    }
    
    // Calculate wait time, but don't exceed maxWaitTime
    const waitTime = Math.min(this.getTimeToReset(key), maxWaitTime);
    
    // If wait time is too long, return false
    if (waitTime >= maxWaitTime) {
      return false;
    }
    
    // Wait for the limit to reset
    await new Promise(resolve => setTimeout(resolve, waitTime + 50));
    
    // Try to acquire the rate limit again
    return this.tryAcquire(key);
  }
}