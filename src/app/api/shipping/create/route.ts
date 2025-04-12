import { NextRequest, NextResponse } from 'next/server';
import { DHLShippingProvider } from '@/lib/shipping/providers/dhl-provider';
import { ShipmentRequest } from '@/lib/shipping/shipping-interfaces';

/**
 * API route to create shipments with DHL
 * POST /api/shipping/create
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const shipmentRequest: ShipmentRequest = await request.json();
    
    // Validate the shipment request
    if (!shipmentRequest.shipperAddress || !shipmentRequest.recipientAddress || !shipmentRequest.packages) {
      return NextResponse.json(
        { error: 'Missing required fields in shipment request' },
        { status: 400 }
      );
    }
    
    // Create an instance of the DHL shipping provider
    const dhlProvider = new DHLShippingProvider();
    
    // Create a shipment with DHL
    const shipment = await dhlProvider.createShipment(shipmentRequest);
    
    // Return the shipment response
    return NextResponse.json({ shipment });
  } catch (error) {
    console.error('Error creating shipment:', error);
    return NextResponse.json(
      { error: 'Failed to create shipment', details: (error as Error).message },
      { status: 500 }
    );
  }
}
