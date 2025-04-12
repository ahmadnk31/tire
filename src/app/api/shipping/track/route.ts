import { NextRequest, NextResponse } from 'next/server';
import { DHLShippingProvider } from '@/lib/shipping/providers/dhl-provider';
import { TrackingRequest } from '@/lib/shipping/shipping-interfaces';

/**
 * API route to track shipments with DHL
 * POST /api/shipping/track
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const trackingRequest: TrackingRequest = await request.json();
    
    // Validate the tracking request
    if (!trackingRequest.trackingNumber) {
      return NextResponse.json(
        { error: 'Missing tracking number' },
        { status: 400 }
      );
    }
    
    // Create an instance of the DHL shipping provider
    const dhlProvider = new DHLShippingProvider();
    
    // Track the shipment with DHL
    const trackingInfo = await dhlProvider.trackShipment(trackingRequest);
    
    // Return the tracking information
    return NextResponse.json({ tracking: trackingInfo });
  } catch (error) {
    console.error('Error tracking shipment:', error);
    return NextResponse.json(
      { error: 'Failed to track shipment', details: (error as Error).message },
      { status: 500 }
    );
  }
}
