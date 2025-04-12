import { NextRequest, NextResponse } from 'next/server';
import { DHLShippingProvider } from '@/lib/shipping/providers/dhl-provider';
import { RateRequest, ShippingServiceType, RateQuote } from '@/lib/shipping/shipping-interfaces';
import { AxiosError } from 'axios';

/**
 * API route to get shipping rates from DHL
 * POST /api/shipping/rates
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const rateRequest: RateRequest = await request.json();
    
    // Validate the rate request
    if (!rateRequest.shipperAddress || !rateRequest.recipientAddress || !rateRequest.packages) {
      return NextResponse.json(
        { error: 'Missing required fields in rate request' },
        { status: 400 }
      );
    }

    // Validate country codes
    const isoCountryCodeRegex = /^[A-Z]{2}$/;
    if (!isoCountryCodeRegex.test(rateRequest.shipperAddress.countryCode) || 
        !isoCountryCodeRegex.test(rateRequest.recipientAddress.countryCode)) {
      console.warn('Invalid country code format. Country codes should be 2-letter ISO codes.');
      
      // Convert country codes to ISO format if needed
      rateRequest.shipperAddress.countryCode = formatCountryCode(rateRequest.shipperAddress.countryCode);
      rateRequest.recipientAddress.countryCode = formatCountryCode(rateRequest.recipientAddress.countryCode);
    }
    
    // Create an instance of the DHL shipping provider
    const dhlProvider = new DHLShippingProvider();
    
    try {
      // Get shipping rates from DHL
      const rates = await dhlProvider.getRates(rateRequest);
      
      // Return the rates
      return NextResponse.json({ rates });
    } catch (dhlError) {
      // Extract and log the detailed error for better debugging
      let errorDetail = 'Unknown error';
      let errorStatus = 500;
      
      if ((dhlError as AxiosError)?.response?.data) {
        const responseData = (dhlError as AxiosError).response?.data as any;
        errorStatus = (dhlError as AxiosError).response?.status || 500;
        
        // Try to extract the specific error reason
        if (responseData.reasons && Array.isArray(responseData.reasons)) {
          errorDetail = responseData.reasons.map((reason: any) => 
            reason.msg || reason.message || reason.description || JSON.stringify(reason)
          ).join(', ');
        } else {
          // Fallback to stringify the entire response
          errorDetail = JSON.stringify(responseData);
        }
      } else {
        errorDetail = (dhlError as Error).message;
      }
      
      console.error(`Error getting rates from DHL (${errorStatus}):`, errorDetail);
      
      // Generate fallback rates if DHL API is unavailable
      const fallbackRates = generateFallbackRates(rateRequest);
      console.log('Using fallback shipping rates due to DHL API error');
      
      return NextResponse.json({ 
        rates: fallbackRates,
        warning: 'Using estimated rates due to shipping provider API issue.',
        apiError: errorDetail,
        errorStatus
      });
    }
  } catch (error) {
    console.error('Error processing shipping rates request:', error);
    return NextResponse.json(
      { error: 'Failed to get shipping rates', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Formats country code to ISO 2-letter format
 */
function formatCountryCode(code: string): string {
  if (!code) return 'US'; // Default
  
  // If already 2 letters, return as is
  if (code.length === 2) {
    return code.toUpperCase();
  }
  
  // Map of country names to ISO codes
  const countryMap: Record<string, string> = {
    'BELGIUM': 'BE',
    'belgium': 'BE',
    'GERMANY': 'DE',
    'FRANCE': 'FR',
    'NETHERLANDS': 'NL',
    'UNITED STATES': 'US',
    'USA': 'US',
    'UNITED KINGDOM': 'GB',
    'UK': 'GB'
  };
  
  return countryMap[code.toUpperCase()] || 'US';
}

/**
 * Generate fallback shipping rates when DHL API is unavailable
 */
function generateFallbackRates(request: RateRequest): RateQuote[] {
  // Calculate total weight for rate calculation
  const totalWeight = request.packages.reduce((sum, pkg) => sum + pkg.weight, 0);
  
  // Get today's date for delivery estimates
  const today = new Date();
  
  // Generate fallback rates for different service levels
  return [
    {
      providerName: 'DHL',
      serviceType: ShippingServiceType.ECONOMY,
      deliveryDate: new Date(today.setDate(today.getDate() + 7)), // 7 days
      totalAmount: Math.max(15, totalWeight * 5),
      currency: 'USD',
      transitDays: 5,
      rateId: 'fallback-economy'
    },
    {
      providerName: 'DHL',
      serviceType: ShippingServiceType.STANDARD,
      deliveryDate: new Date(today.setDate(today.getDate() + 4)), // 4 days
      totalAmount: Math.max(20, totalWeight * 7),
      currency: 'USD',
      transitDays: 3,
      rateId: 'fallback-standard'
    },
    {
      providerName: 'DHL',
      serviceType: ShippingServiceType.EXPRESS,
      deliveryDate: new Date(today.setDate(today.getDate() + 2)), // 2 days
      totalAmount: Math.max(30, totalWeight * 10),
      currency: 'USD',
      transitDays: 1,
      rateId: 'fallback-express'
    }
  ];
}
