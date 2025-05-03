import { RateLimiter } from "@/lib/utils/rate-limiter";

type RateLimitOptions = {
  interval: number;
  limit: number;
  uniqueTokenPerInterval?: number;
};

/**
 * Create a rate limiter for API routes
 */
export function rateLimit(options: RateLimitOptions) {
  const { interval, limit, uniqueTokenPerInterval = 500 } = options;
  const limiter = new RateLimiter(limit, interval);

  return {
    check: async (token: string): Promise<void> => {
      const key = `rl:${token}:${Math.floor(Date.now() / interval)}`;

      const isAllowed = limiter.tryAcquire(key);

      if (!isAllowed) {
        throw new Error("Too many requests");
      }
    },
  };
}
