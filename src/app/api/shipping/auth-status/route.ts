import { NextResponse } from 'next/server';
import { DHLShippingProvider } from '@/lib/shipping/providers/dhl-provider';

/**
 * API route to check shipping API authentication status
 * GET /api/shipping/auth-status
 */
export async function GET() {
  try {
    // Create an instance of the DHL shipping provider
    const dhlProvider = new DHLShippingProvider();
    
    // Test authentication with DHL API
    const authStatus = await dhlProvider.testAuthentication();
    
    // Return the authentication status
    return NextResponse.json(authStatus);
  } catch (error) {
    console.error('Error checking shipping authentication:', error);
    return NextResponse.json(
      { authenticated: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}
