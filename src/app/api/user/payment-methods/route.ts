import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { maskPaymentMethod } from "./maskPaymentMethod";



// Schema for validating payment method data
const paymentMethodSchema = z.object({
  // For when a payment method ID is directly provided by the frontend
  stripePaymentMethodId: z.string().optional(),
  
  // For direct card creation (not recommended for production)
  cardNumber: z.string().optional(),
  expiryMonth: z.number().optional(),
  expiryYear: z.number().optional(),
  cvc: z.string().optional(),
  
  // Billing details
  billingAddressId: z.string().optional(), // Link to an existing UserAddress
  
  // Or provide raw address data
  billingName: z.string().optional(),
  billingEmail: z.string().email().optional(),
  billingPhone: z.string().optional(),
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCountry: z.string().optional(),
  
  isDefault: z.boolean().default(false),
});

// Helper function has been moved to ./maskPaymentMethod.ts

// Helper function to get or create a Stripe customer for a user
async function getOrCreateStripeCustomer(userId: string) {
  // Get the user with their Stripe customer ID
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true }
  });
  
  if (!user) {
    throw new Error("User not found");
  }
  
  // If user already has a Stripe customer ID, retrieve and return that customer
  if (user.stripeCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      
      // If customer was not deleted, return it
      if (!customer.deleted) {
        return customer;
      }
      // Otherwise, we'll create a new one below
    } catch (error) {
      // If customer doesn't exist in Stripe anymore, we'll create a new one
      console.error("Error retrieving Stripe customer:", error);
    }
  }
  
  // Create a new customer in Stripe
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: {
      userId: user.id
    }
  });
  
  // Store the Stripe customer ID with the user
  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id }
  });
  
  return customer;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
  // Get all payment methods for the current user
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        billingAddress: true  // Include the related UserAddress for billing
      }
    });
    
    // Map and mask sensitive data
    const maskedPaymentMethods = paymentMethods.map(maskPaymentMethod);
    
    return NextResponse.json(maskedPaymentMethods);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment methods" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Validate request data
    const result = paymentMethodSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: result.error.format() },
        { status: 400 }
      );
    }
    
    const paymentData = result.data;
    
    // Get or retrieve the Stripe payment method
    let stripePaymentMethod;
    
    // Case 1: Frontend already created a payment method with Stripe Elements 
    // and passed the ID (recommended approach)
    if (paymentData.stripePaymentMethodId) {
      try {
        stripePaymentMethod = await stripe.paymentMethods.retrieve(
          paymentData.stripePaymentMethodId
        );
      } catch (error) {
        console.error("Invalid Stripe payment method ID:", error);
        return NextResponse.json(
          { error: "Invalid payment method ID provided" },
          { status: 400 }
        );
      }
    } 
    // Case 2: Direct card creation (not recommended for production)
    else if (paymentData.cardNumber && paymentData.expiryMonth && paymentData.expiryYear && paymentData.cvc) {
      // Note: This approach is not recommended for production as it puts card data
      // through your server. Stripe Elements should be used on the frontend instead.
      try {
        stripePaymentMethod = await stripe.paymentMethods.create({
          type: 'card',
          card: {
            number: paymentData.cardNumber,
            exp_month: paymentData.expiryMonth,
            exp_year: paymentData.expiryYear,
            cvc: paymentData.cvc,
          },
          billing_details: {
            name: paymentData.billingName,
            email: paymentData.billingEmail,
            phone: paymentData.billingPhone,
            address: {
              line1: paymentData.billingAddress,
              city: paymentData.billingCity,
              state: paymentData.billingState,
              postal_code: paymentData.billingPostalCode,
              country: paymentData.billingCountry,
            },
          },
        });
      } catch (error) {
        console.error("Error creating Stripe payment method:", error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Invalid card details" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Either a Stripe payment method ID or complete card details are required" },
        { status: 400 }
      );
    }
    
    // Get or create the customer in Stripe
    let customer;
    try {
      customer = await getOrCreateStripeCustomer(session.user.id);
    } catch (error) {
      console.error("Error getting/creating Stripe customer:", error);
      return NextResponse.json(
        { error: "Failed to process customer information" },
        { status: 500 }
      );
    }
    
    // Attach the payment method to the customer
    try {
      await stripe.paymentMethods.attach(stripePaymentMethod.id, {
        customer: customer.id,
      });
    } catch (error) {
      console.error("Error attaching payment method to customer:", error);
      return NextResponse.json(
        { error: "Failed to attach payment method to customer" },
        { status: 500 }
      );
    }
    
    // If this is the first payment method or marked as default, make it the default
    const existingMethodsCount = await prisma.paymentMethod.count({
      where: { userId: session.user.id }
    });
    
    const isDefault = existingMethodsCount === 0 || paymentData.isDefault;
    
    // If making this payment method default, unset default flag on all other methods
    if (isDefault) {
      await prisma.paymentMethod.updateMany({
        where: { 
          userId: session.user.id,
          isDefault: true
        },
        data: { isDefault: false }
      });
      
      // Set as default payment method in Stripe too
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: stripePaymentMethod.id,
        },
      });
    }
      // Extract card details from the Stripe payment method
    const card = stripePaymentMethod.card;
    const billingDetails = stripePaymentMethod.billing_details || {};

    // Check if we need to create or use an existing address
    let billingAddressId = paymentData.billingAddressId;
      // If no existing address ID was provided but we have address details, create a new address
    if (!billingAddressId && 
        (paymentData.billingAddress || (billingDetails.address && 'line1' in billingDetails.address))) {
      try {
        // Use address from Stripe payment method if available, otherwise use provided data
        const address = billingDetails.address as Record<string, any> || {};
        const name = billingDetails.name || paymentData.billingName || '';
        const nameArray = name.split(' ');
        const firstName = nameArray.length > 0 ? nameArray[0] : '';
        const lastName = nameArray.length > 1 ? nameArray.slice(1).join(' ') : '';
        
        const newAddress = await prisma.userAddress.create({
          data: {
            userId: session.user.id,
            addressType: 'BILLING',
            firstName: firstName,
            lastName: lastName,
            addressLine1: ('line1' in address ? address.line1 : null) || paymentData.billingAddress || '',
            addressLine2: ('line2' in address ? address.line2 : null) || null,
            city: ('city' in address ? address.city : null) || paymentData.billingCity || '',
            state: ('state' in address ? address.state : null) || paymentData.billingState || '',
            postalCode: ('postal_code' in address ? address.postal_code : null) || paymentData.billingPostalCode || '',
            country: ('country' in address ? address.country : null) || paymentData.billingCountry || '',
            phoneNumber: billingDetails.phone || paymentData.billingPhone || null,
            isDefault: false,
          }
        });
        
        billingAddressId = newAddress.id;
      } catch (error) {
        console.error("Failed to create user address:", error);
        // Continue without setting the address ID
      }
    }
    
    // Create new payment method in our database
    const newPaymentMethod = await prisma.paymentMethod.create({
      data: {
        userId: session.user.id,
        type: stripePaymentMethod.type,
        cardBrand: card?.brand,
        last4: card?.last4,
        expiryMonth: card?.exp_month,
        expiryYear: card?.exp_year,
        fingerprint: card?.fingerprint,
        stripePaymentMethodId: stripePaymentMethod.id,
        billingAddressId,        // Keep legacy fields for backward compatibility
        billingName: paymentData.billingName,
        billingEmail: paymentData.billingEmail,
        billingPhone: paymentData.billingPhone || null,
        billingAddressLine: paymentData.billingAddress,
        billingCity: paymentData.billingCity,
        billingState: paymentData.billingState || null,
        billingPostalCode: paymentData.billingPostalCode || null,
        billingCountry: paymentData.billingCountry || null,
        isDefault,
        providerPaymentId: stripePaymentMethod.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        billingAddress: true
      }
    });
    
    return NextResponse.json(maskPaymentMethod(newPaymentMethod));
  } catch (error: any) {
    console.error("Error adding payment method:", error);
    
    // Handle Stripe-specific errors
    if (error && error.type === 'StripeCardError') {
      return NextResponse.json(
        { error: error.message || "Your card was declined" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to add payment method" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "Payment method ID is required" },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Check if the payment method belongs to the user
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });
    
    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }
    
    // Update billing details in Stripe if we have a Stripe payment method ID
    if (paymentMethod.providerPaymentId && (body.billingName || body.billingEmail || body.billingPhone || body.billingAddress)) {
      try {
        await stripe.paymentMethods.update(
          paymentMethod.providerPaymentId,
          {
            billing_details: {
              name: body.billingName || undefined,
              email: body.billingEmail || undefined,
              phone: body.billingPhone || undefined,
              address: {
                line1: body.billingAddress || undefined,
                city: body.billingCity || undefined,
                state: body.billingState || undefined,
                postal_code: body.billingPostalCode || undefined,
                country: body.billingCountry || undefined,
              },
            },
          }
        );
      } catch (error) {
        console.error("Error updating Stripe payment method:", error);
        // Continue with local update even if Stripe update fails
      }
    }
    
    // If setting as default, unset default flag on all other methods
    if (body.isDefault) {
      await prisma.paymentMethod.updateMany({
        where: { 
          userId: session.user.id,
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      });
      
      // Set default payment method in Stripe
      if (paymentMethod.providerPaymentId) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { stripeCustomerId: true }
        });
        
        if (user?.stripeCustomerId) {
          try {
            // Set as default payment method in Stripe
            await stripe.customers.update(user.stripeCustomerId, {
              invoice_settings: {
                default_payment_method: paymentMethod.providerPaymentId,
              },
            });
          } catch (error) {
            console.error("Error updating default payment method in Stripe:", error);
            // Continue with local update even if Stripe update fails
          }
        }
      }
    }
    
    // Update payment method fields in our database
    const updatedPaymentMethod = await prisma.paymentMethod.update({
      where: { id },
      data: {
        isDefault: body.isDefault ?? paymentMethod.isDefault,        billingName: body.billingName ?? paymentMethod.billingName,
        billingEmail: body.billingEmail ?? paymentMethod.billingEmail,
        billingPhone: body.billingPhone ?? paymentMethod.billingPhone,
        billingAddressLine: body.billingAddress ?? paymentMethod.billingAddressLine,
        billingCity: body.billingCity ?? paymentMethod.billingCity,
        billingState: body.billingState ?? paymentMethod.billingState,
        billingPostalCode: body.billingPostalCode ?? paymentMethod.billingPostalCode,
        billingCountry: body.billingCountry ?? paymentMethod.billingCountry,
        updatedAt: new Date(),
      }
    });
    
    return NextResponse.json(maskPaymentMethod(updatedPaymentMethod));
  } catch (error) {
    console.error("Error updating payment method:", error);
    return NextResponse.json(
      { error: "Failed to update payment method" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "Payment method ID is required" },
        { status: 400 }
      );
    }
    
    // Check if the payment method belongs to the user
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });
    
    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }
    
    // Delete the payment method from Stripe if we have a provider ID
    if (paymentMethod.providerPaymentId) {
      try {
        // Note: Stripe doesn't allow direct deletion of payment methods
        // Instead, we detach it from the customer
        await stripe.paymentMethods.detach(paymentMethod.providerPaymentId);
      } catch (stripeError) {
        console.error("Error detaching payment method from Stripe:", stripeError);
        // Continue with local deletion even if Stripe detach fails
      }
    }
    
    // Delete the payment method from our database
    await prisma.paymentMethod.delete({
      where: { id }
    });
    
    // If deleted method was default and other methods exist, make another one default
    if (paymentMethod.isDefault) {
      const otherMethod = await prisma.paymentMethod.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' }
      });
      
      if (otherMethod) {
        await prisma.paymentMethod.update({
          where: { id: otherMethod.id },
          data: { isDefault: true }
        });
        
        // Update Stripe default payment method if we have a provider ID
        if (otherMethod.providerPaymentId) {
          const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { stripeCustomerId: true }
          });
          
          if (user?.stripeCustomerId) {
            try {
              // Set as default payment method in Stripe
              await stripe.customers.update(user.stripeCustomerId, {
                invoice_settings: {
                  default_payment_method: otherMethod.providerPaymentId,
                },
              });
            } catch (error) {
              console.error("Error updating default payment method in Stripe:", error);
              // Continue even if Stripe update fails
            }
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Payment method deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    return NextResponse.json(
      { error: "Failed to delete payment method" },
      { status: 500 }
    );
  }
}