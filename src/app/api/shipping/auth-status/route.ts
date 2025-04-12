import { NextRequest, NextResponse } from 'next/server';
import { DHLShippingProvider } from '@/lib/shipping/providers/dhl-provider';

/**
 * API route to test DHL authentication status
 * GET /api/shipping/auth-status
 */
export async function GET(request: NextRequest) {
  try {
    // Create an instance of the DHL shipping provider
    const dhlProvider = new DHLShippingProvider();
    
    // Test authentication with DHL
    const authStatus = await dhlProvider.testAuthentication();
    
    // Return the authentication status
    return NextResponse.json({ 
      authenticated: authStatus.authenticated,
      message: authStatus.message
    });
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Authentication failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
