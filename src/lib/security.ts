import { headers } from "next/headers";
import { cookies } from "next/headers";

/**
 * Extract client IP address from request
 */
export async function getIpAddress(request: Request): Promise<string> {
  const headersList = headers();

  // Check for forwarded IP (standard and CloudFlare headers)
  const forwardedFor =
    (await headersList).get("x-forwarded-for") ||
    (await headersList).get("cf-connecting-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  // Try to get from request directly if available
  const url = new URL(request.url);
  const remoteAddr = url.hostname;

  return remoteAddr || "127.0.0.1";
}

/**
 * Validate a CSRF token against the stored token in cookies
 */
export async function validateCsrfToken(token: string): Promise<boolean> {
  try {
    // Get the stored CSRF token from cookies
    const cookieToken = (await cookies()).get("csrf_token")?.value;

    // If no token in cookies, fail validation
    if (!cookieToken) {
      return false;
    }

    // Simple equality check - in production you might want a more robust way
    // like time-based validation or comparing against a token stored in user session
    return token === cookieToken;
  } catch (error) {
    console.error("Error validating CSRF token:", error);
    return false;
  }
}
