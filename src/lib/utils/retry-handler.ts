/**
 * Utility to retry operations that might fail temporarily
 */

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param maxRetries Maximum number of retries
 * @param delay Initial delay in ms
 * @param backoffFactor Factor to multiply delay by after each retry
 * @returns Promise with result of the function
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 500,
  backoffFactor: number = 2
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Try to execute the function
      return await fn();
    } catch (error) {
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Save the error to throw if all retries fail
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Determine if we should retry based on the error type
      // For example, don't retry for 400 errors which indicate client errors
      if (error && typeof error === 'object' && 'status' in error) {
        const status = Number(error.status);
        // Don't retry for client errors (4xx except 429 Too Many Requests)
        if (status >= 400 && status < 500 && status !== 429) {
          throw error;
        }
      }
      
      // Calculate backoff delay
      const backoffDelay = delay * Math.pow(backoffFactor, attempt);
      
      // Wait before next attempt with exponential backoff
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      
      // Log the retry attempt
      console.warn(`Retrying failed operation (attempt ${attempt + 1}/${maxRetries})`, lastError);
    }
  }
  
  // This shouldn't be reached due to the throw in the loop, but TypeScript needs it
  throw lastError!;
}

/**
 * Check if an error should be retried
 * Useful for customizing retry behavior
 * @param error The error to check
 * @returns True if the error should be retried
 */
export function isRetryableError(error: unknown): boolean {
  // Network errors should be retried
  if (error && typeof error === 'object' && 'code' in error) {
    const networkErrors = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND'];
    if (typeof error.code === 'string' && networkErrors.includes(error.code)) {
      return true;
    }
  }
  
  // Status code based retry
  if (error && typeof error === 'object' && 'status' in error) {
    const status = Number(error.status);
    
    // Retry server errors and rate limits
    if (status >= 500 || status === 429) {
      return true;
    }
  }
  
  return false;
}