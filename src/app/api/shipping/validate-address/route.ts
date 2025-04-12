import { NextRequest, NextResponse } from 'next/server';
import { DHLShippingProvider } from '@/lib/shipping/providers/dhl-provider';
import { Address } from '@/lib/shipping/shipping-interfaces';

/**
 * API route to validate shipping addresses with DHL
 * POST /api/shipping/validate-address
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const addressData: Address = await request.json();
    
    // Validate the address data
    if (!addressData.street || !addressData.city || !addressData.postalCode || !addressData.countryCode) {
      return NextResponse.json(
        { error: 'Missing required address fields', valid: false },
        { status: 400 }
      );
    }
    
    // Create an instance of the DHL shipping provider
    const dhlProvider = new DHLShippingProvider();
    
    // Validate the address with DHL
    const validationResult = await dhlProvider.validateAddress(addressData);
    
    // Return the validation result
    return NextResponse.json({ 
      valid: validationResult.valid,
      suggestedAddress: validationResult.suggestedAddress,
      messages: validationResult.messages
    });
  } catch (error) {
    console.error('Error validating address:', error);
    return NextResponse.json(
      { error: 'Failed to validate address', details: (error as Error).message, valid: false },
      { status: 500 }
    );
  }
}
