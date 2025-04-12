import { NextRequest, NextResponse } from 'next/server';
import { ShippingProviderFactory } from '@/lib/shipping/shipping-provider-factory';
import { ShipmentRequest } from '@/lib/shipping/shipping-interfaces';
import { DHLShippingProvider } from '@/lib/shipping/providers/dhl-provider';

/**
 * API route for manual shipping creation
 * This provides a fallback when automatic shipping creation fails
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const requestData = await request.json();
    
    // Validate request data
    if (!requestData.shipmentRequest) {
      return NextResponse.json(
        { error: 'Missing shipment request data' },
        { status: 400 }
      );
    }

    // Extract data from request
    const { 
      shipmentRequest, 
      manualTrackingNumber,
      provider = 'dhl' // Default to DHL if not specified
    } = requestData;

    console.log(`Processing manual shipping creation for provider: ${provider}`);
    
    // Create shipping provider instance
    let shippingProvider;
    
    // Currently we only support manual creation for DHL
    if (provider.toLowerCase() === 'dhl') {
      shippingProvider = new DHLShippingProvider();
    } else {
      return NextResponse.json(
        { error: `Manual shipping creation not supported for provider: ${provider}` },
        { status: 400 }
      );
    }

    // Create manual shipment
    const shipmentResponse = await (shippingProvider as DHLShippingProvider).createManualShipment(
      shipmentRequest as ShipmentRequest,
      manualTrackingNumber
    );

    console.log('Manual shipment created successfully:', shipmentResponse.trackingNumber);

    // Return response
    return NextResponse.json({
      success: true,
      message: 'Manual shipment created successfully',
      shipment: shipmentResponse
    });
  } catch (error) {
    console.error('Error creating manual shipment:', error);
    return NextResponse.json(
      { error: `Failed to create manual shipment: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
