import { NextRequest, NextResponse } from "next/server";
import { DHLShippingProvider } from "@/lib/shipping/providers/dhl-provider";
import {
  RateRequest,
  ShippingServiceType,
  RateQuote,
} from "@/lib/shipping/shipping-interfaces";
import { AxiosError } from "axios";

// Simple retry mechanism for API calls
async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>, 
  maxRetries: number = 2,
  providerName: string
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add increasing delay between retries (exponential backoff)
      if (attempt > 0) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 100));
      }
      
      const startTime = performance.now();
      const result = await fetchFn();
      const endTime = performance.now();
      
      // Log performance metrics
      console.log(`Shipping API call to ${providerName} succeeded [${attempt > 0 ? `retry ${attempt}` : 'first try'}] in ${Math.round(endTime - startTime)}ms`);
      
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`Shipping API call to ${providerName} failed [attempt ${attempt + 1}/${maxRetries + 1}]:`, error);
    }
  }
  
  // If we get here, all retries failed
  throw lastError;
}

// Helper functions to fetch rates from different providers (these would normally be imported)
async function fetchDHLRates(request: RateRequest): Promise<RateQuote[]> {
  const dhlProvider = new DHLShippingProvider();
  return fetchWithRetry(() => dhlProvider.getRates(request), 2, 'DHL');
}

async function fetchUPSRates(request: RateRequest): Promise<RateQuote[]> {
  // Implement UPS rate fetching or return empty array
  return [];
}

async function fetchGLSRates(request: RateRequest): Promise<RateQuote[]> {
  // Implement GLS rate fetching or return empty array
  return [];
}

/**
 * API route to get shipping rates
 * POST /api/shipping/rates
 */
export async function POST(request: NextRequest) {
  const requestStartTime = performance.now();
  
  try {
    const rateRequest: RateRequest = await request.json();
    
    // Validate the rate request
    if (!rateRequest.recipientAddress) {
      return NextResponse.json(
        { error: "Missing recipient address", success: false },
        { status: 400 }
      );
    }
    
    if (!rateRequest.packages || rateRequest.packages.length === 0) {
      return NextResponse.json(
        { error: "Missing package details", success: false },
        { status: 400 }
      );
    }
    
    // Load shipping configuration from environment variables or database
    const dhlEnabled = process.env.DHL_ENABLED === 'true';
    const upsEnabled = process.env.UPS_ENABLED === 'true';
    const glsEnabled = process.env.GLS_ENABLED === 'true';
    
    // Track all errors for better diagnostics
    const errors: {provider: string; message: string}[] = [];
    let rates: RateQuote[] = [];
    
    // Try DHL first if enabled
    if (dhlEnabled) {
      try {
        const dhlRates = await fetchDHLRates(rateRequest);
        rates = [...rates, ...dhlRates];
      } catch (error) {
        console.error('Error fetching DHL rates:', error);
        errors.push({
          provider: 'DHL', 
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Try UPS if enabled
    if (upsEnabled) {
      try {
        const upsRates = await fetchUPSRates(rateRequest);
        rates = [...rates, ...upsRates];
      } catch (error) {
        console.error('Error fetching UPS rates:', error);
        errors.push({
          provider: 'UPS', 
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Try GLS if enabled
    if (glsEnabled) {
      try {
        const glsRates = await fetchGLSRates(rateRequest);
        rates = [...rates, ...glsRates];
      } catch (error) {
        console.error('Error fetching GLS rates:', error);
        errors.push({
          provider: 'GLS', 
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // If we have no rates from any provider but have fallback rates enabled
    if (rates.length === 0) {
      if (process.env.USE_FALLBACK_RATES === 'true') {
        const fallbackRates = generateFallbackRates(rateRequest);
        rates = fallbackRates;
        console.log('Using fallback shipping rates');
      } else {
        // Return error details if fallback rates are disabled
        return NextResponse.json({
          error: "Unable to fetch shipping rates from any provider",
          providerErrors: errors,
          success: false
        }, { status: 503 });
      }
    }
    
    // Sort rates by price (lowest first)
    rates.sort((a, b) => a.totalAmount - b.totalAmount);
    
    // Add performance timing to response
    const requestDuration = Math.round(performance.now() - requestStartTime);
    
    return NextResponse.json({
      rates,
      success: true,
      errors: errors.length > 0 ? errors : undefined,
      performance: {
        totalDurationMs: requestDuration
      }
    });
  } catch (error) {
    const requestDuration = Math.round(performance.now() - requestStartTime);
    
    console.error(`Error in shipping rates API route (${requestDuration}ms):`, error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error', 
        success: false,
        performance: {
          totalDurationMs: requestDuration,
          failed: true
        }
      },
      { status: 500 }
    );
  }
}

/**
 * Formats country code to ISO 2-letter format
 */
function formatCountryCode(code: string): string {
  if (!code) return "US"; // Default

  // If already 2 letters, return as is
  if (code.length === 2) {
    return code.toUpperCase();
  }

  // Map of country names to ISO codes
  const countryMap: Record<string, string> = {
    BELGIUM: "BE",
    belgium: "BE",
    GERMANY: "DE",
    FRANCE: "FR",
    NETHERLANDS: "NL",
    "UNITED STATES": "US",
    USA: "US",
    "UNITED KINGDOM": "GB",
    UK: "GB",
  };

  return countryMap[code.toUpperCase()] || "US";
}

/**
 * Generate fallback shipping rates when DHL API is unavailable
 */
function generateFallbackRates(request: RateRequest): RateQuote[] {
  // Calculate total weight for rate calculation
  const totalWeight = request.packages.reduce(
    (sum, pkg) => sum + pkg.weight,
    0
  );

  // Get today's date for delivery estimates
  const today = new Date();

  // Generate fallback rates for different service levels
  return [
    {
      providerName: "DHL",
      serviceType: ShippingServiceType.ECONOMY,
      deliveryDate: new Date(today.setDate(today.getDate() + 7)), // 7 days
      totalAmount: Math.max(15, totalWeight * 5),
      currency: "USD",
      transitDays: 5,
      rateId: "fallback-economy",
    },
    {
      providerName: "DHL",
      serviceType: ShippingServiceType.STANDARD,
      deliveryDate: new Date(today.setDate(today.getDate() + 4)), // 4 days
      totalAmount: Math.max(20, totalWeight * 7),
      currency: "USD",
      transitDays: 3,
      rateId: "fallback-standard",
    },
    {
      providerName: "DHL",
      serviceType: ShippingServiceType.EXPRESS,
      deliveryDate: new Date(today.setDate(today.getDate() + 2)), // 2 days
      totalAmount: Math.max(30, totalWeight * 10),
      currency: "USD",
      transitDays: 1,
      rateId: "fallback-express",
    },
  ];
}

/**
 * API route to get shipping rates from GLS
 * POST /api/shipping/gls-rates
 */
// export async function POST(request: Request) {
//   try {
//     const body = await request.json();
//     const { token, shipmentDetails } = body;

//     if (!token) {
//       return NextResponse.json(
//         { error: "Authorization token is required" },
//         { status: 400 }
//       );
//     }

//     const response = await fetch(
//       "https://api-sandbox.gls-group.net/rates/v2/prices",
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//           Accept: "application/json",
//         },
//         body: JSON.stringify({ shipmentDetails }),
//       }
//     );

//     // If GLS API returns an error
//     if (!response.ok) {
//       const errorData = await response.json();
//       return NextResponse.json(
//         { error: `GLS API error: ${response.status}`, details: errorData },
//         { status: response.status }
//       );
//     }

//     const data = await response.json();
//     return NextResponse.json(data);
//   } catch (error: any) {
//     console.error("Error in shipping rates API route:", error);
//     return NextResponse.json(
//       { error: error.message || "Internal server error" },
//       { status: 500 }
//     );
//   }
// }
