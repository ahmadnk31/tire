import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/db";
import { getOrderNumber } from "@/lib/order-helpers";
import { authOptions } from "@/lib/auth/auth-options";
import { ShippingService } from '@/lib/shipping/shipping-service';

// Key for database storage of default shipping provider
const DEFAULT_SHIPPING_PROVIDER_KEY = 'default_shipping_provider';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    const { 
      items, 
      total,
      subtotal,
      tax,
      shipping: shippingCost,
      discount, 
      shippingAddress, 
      shippingMethod,
      paymentIntentId,
      paymentMethod
    } = body;

    if (!items || !items.length || !shippingAddress || !shippingMethod) {
      return NextResponse.json(
        { error: "Invalid order data provided" },
        { status: 400 }
      );
    }

    // Get the default shipping provider from database
    let defaultProvider = 'DHL'; // Default to DHL if nothing is found
    try {
      const providerSetting = await prisma.systemSetting.findUnique({
        where: { key: DEFAULT_SHIPPING_PROVIDER_KEY }
      });
      
      if (providerSetting) {
        defaultProvider = providerSetting.value;
      }
    } catch (error) {
      console.error("Error fetching default shipping provider:", error);
      // Continue with DHL as fallback
    }
    
    // Try to validate the address but continue even if validation fails
    let addressValidated = false;
    try {
      const isValidAddress = await ShippingService.validateAddress(
        shippingAddress, 
        defaultProvider
      );
      
      // If address is explicitly invalid, return an error
      if (isValidAddress.isValid === false && isValidAddress.suggestedAddress) {
        return NextResponse.json(
          { 
            error: 'Invalid shipping address', 
            suggestedAddress: isValidAddress.suggestedAddress 
          },
          { status: 400 }
        );
      }
      
      // Address is valid or we couldn't determine validity
      addressValidated = isValidAddress.isValid === true;
    } catch (error) {
      console.warn("Address validation failed, continuing with order process:", error);
      // Continue with order creation even if validation fails
    }

    // Generate a unique order number
    const orderNumber = await getOrderNumber();
    
    // Create metadata object
    const metadataObject = {
      paymentId: paymentIntentId || null,
      shippingMethod: {
        name: shippingMethod.name,
        price: shippingMethod.price,
        estimatedDelivery: shippingMethod.estimatedDelivery,
        provider: shippingMethod.provider || defaultProvider,
        serviceLevel: shippingMethod.serviceLevel || 'standard'
      },
      customerInfo: {
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        email: shippingAddress.email,
        phone: shippingAddress.phone || null,
      },
      tax: tax || 0,
      discount: discount || 0,
      guestOrder: !session?.user?.id, // True if no logged-in user
      guestEmail: shippingAddress.email,
      addressValidated: addressValidated,
      providerSpecificData: {}
    };

    // Prepare the base order data
    const orderData: any = {
      orderNumber,
      status: "PROCESSING",
      total,
      subtotal,
      // Map to existing fields in the schema
      shippingAddressLine1: shippingAddress.addressLine1,
      shippingAddressLine2: shippingAddress.addressLine2 || null,
      shippingCity: shippingAddress.city,
      shippingState: shippingAddress.state,
      shippingPostalCode: shippingAddress.postalCode,
      shippingCountry: shippingAddress.country,
      // Use billing address from shipping if not provided separately
      billingAddress: `${shippingAddress.addressLine1}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}`,
      paymentMethod: paymentMethod === "paypal" ? "PAYPAL" : "STRIPE",
      // Initialize with empty tracking URL, will update after shipment is created
      trackingUrl: '',
      trackingNumber: '',
      // Store metadata as JSON
      metadata: metadataObject,
      // Update payment status
      paymentStatus: "PAID",
      // Create order items
      orderItems: {
        create: items.map((item: any) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          isWholesalePrice: false,
        })),
      },
    };

    // Only include userId if user is logged in
    if (session?.user?.id) {
      orderData.userId = session.user.id;
    }

    // Create the order in the database - matching the actual schema
    const order = await prisma.order.create({
      data: orderData,
    });

    // After order is created, try to create the shipment but make it optional
    try {
      // Create shipment request properly matching the interface
      const shipmentRequest = {
        shipperAddress: {
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
        },
        recipientAddress: {
          contactName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
          phone: shippingAddress.phone || '',
          email: shippingAddress.email,
          addressLine1: shippingAddress.addressLine1,
          addressLine2: shippingAddress.addressLine2 || '',
          city: shippingAddress.city,
          state: shippingAddress.state,
          postalCode: shippingAddress.postalCode,
          countryCode: shippingAddress.country
        },
        packages: items.map((item: any) => ({
          weight: item.weight || 0.5, // default weight if not specified
          length: item.dimensions?.length || 10,
          width: item.dimensions?.width || 10,
          height: item.dimensions?.height || 10,
          description: item.name || `Product ID: ${item.id}`
        })),
        serviceType: shippingMethod.serviceLevel,
        reference: `Order-${orderNumber}`,
        // Use specified provider or default
        provider: shippingMethod.provider || defaultProvider
      };

      // Try to create shipment but don't fail if it doesn't work
      const actualProvider = shipmentRequest.provider || defaultProvider;
      const shipmentResult = await ShippingService.createShipment(
        shipmentRequest, 
        actualProvider
      ).catch(error => {
        console.warn("Failed to create shipment, will need to do this manually:", error);
        return null;
      });

      // Update the order with tracking information if shipment was created
      if (shipmentResult && shipmentResult.trackingNumber) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            trackingNumber: shipmentResult.trackingNumber,
            trackingUrl: shipmentResult.labelUrl,
            metadata: {
              ...metadataObject,
              providerSpecificData: {
                shipmentId: shipmentResult.shipmentId,
                labelUrl: shipmentResult.labelUrl,
                totalShippingCost: shipmentResult.totalAmount,
                currency: shipmentResult.currency
              }
            }
          }
        });
      }
    } catch (shipmentError) {
      console.error('Failed to create shipment, will retry later:', shipmentError);
      // Continue with order creation even if shipment creation fails
      // A background job can retry shipment creation
    }

    // Return the created order
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
      },
    });
  } catch (error) {
    console.error("Error creating order:", error);
    
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}