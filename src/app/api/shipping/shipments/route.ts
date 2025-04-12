import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/auth-options";
import { ShippingService } from "@/lib/shipping/shipping-service";
import { ShippingServiceType } from "@/lib/shipping/shipping-interfaces";

// Schema for validating shipment creation requests
const shipmentRequestSchema = z.object({
  // Recipient information
  recipientAddress: z.object({
    contactName: z.string(),
    companyName: z.string().optional(),
    phone: z.string(),
    email: z.string().email(),
    addressLine1: z.string(),
    addressLine2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    countryCode: z.string().length(2) // ISO country code (2 chars)
  }),
  
  // Package details
  packages: z.array(z.object({
    weight: z.number().positive(),
    length: z.number().positive(),
    width: z.number().positive(), 
    height: z.number().positive(),
    description: z.string().optional(),
    packageType: z.string().optional()
  })),
  
  serviceType: z.enum(['STANDARD', 'EXPRESS', 'PRIORITY', 'ECONOMY']),
  isResidential: z.boolean().optional().default(true),
  insuranceValue: z.number().optional(),
  reference: z.string().optional(),
  rateId: z.string().optional(),
  labelFormat: z.enum(['PDF', 'ZPL', 'PNG']).optional().default('PDF'),
  
  // Provider to use for the shipment
  provider: z.string().optional()
});

// POST endpoint to create a new shipment
export async function POST(request: NextRequest) {
  try {
    // Get authentication session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'You must be logged in to create a shipment' },
        { status: 401 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = shipmentRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid shipment request',
          details: validationResult.error.format()
        },
        { status: 400 }
      );
    }
    
    const {
      recipientAddress,
      packages,
      serviceType,
      isResidential,
      insuranceValue,
      reference,
      rateId,
      labelFormat,
      provider
    } = validationResult.data;
    
    // Get shipper information from environment variables
    const shipperAddress = {
      contactName: process.env.SHIPPER_CONTACT_NAME || '',
      companyName: process.env.SHIPPER_COMPANY_NAME || '',
      phone: process.env.SHIPPER_PHONE || '',
      email: process.env.SHIPPER_EMAIL || '',
      addressLine1: process.env.SHIPPER_ADDRESS_LINE1 || '',
      addressLine2: process.env.SHIPPER_ADDRESS_LINE2 || '',
      city: process.env.SHIPPER_CITY || '',
      state: process.env.SHIPPER_STATE || '',
      postalCode: process.env.SHIPPER_POSTAL_CODE || '',
      countryCode: process.env.SHIPPER_COUNTRY_CODE || 'US'
    };
    
    // Create shipment request
    const shipmentRequest = {
      shipperAddress,
      recipientAddress,
      packages,
      serviceType: serviceType as ShippingServiceType,
      isResidential,
      insuranceValue,
      reference: reference || `Order-${Date.now()}`,
      rateId,
      labelFormat
    };
    
    // Create the shipment with the specified provider
    const shipment = await ShippingService.createShipment(shipmentRequest, provider);
    
    // Return the created shipment data
    return NextResponse.json({ 
      shipment,
      success: true,
      message: 'Shipment created successfully'
    });
  } catch (error) {
    console.error('Error creating shipment:', error);
    return NextResponse.json(
      { error: 'Failed to create shipment', message: (error as Error).message },
      { status: 500 }
    );
  }
}