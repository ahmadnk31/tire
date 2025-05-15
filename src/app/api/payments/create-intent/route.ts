import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency = "eur", metadata = {} } = body;

    // Validate the input
    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount provided" },
        { status: 400 }
      );
    }

    // Get the session for the current user (optional)
    const session = await getServerSession(authOptions);

    // Prepare PaymentIntent options
    const paymentIntentOptions: any = {
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        ...metadata,
        created_at: new Date().toISOString(),
      },
    };

    // If we have a user session, attach customer information
    if (session?.user?.email) {
      // Try to find existing customer or create new one
      try {
        const customers = await stripe.customers.list({
          email: session.user.email,
          limit: 1,
        });

        let customerId: string;

        if (customers.data.length > 0) {
          // Use existing customer
          customerId = customers.data[0].id;
        } else {
          // Create new customer
          const newCustomer = await stripe.customers.create({
            email: session.user.email,
            name: session.user.name || undefined,
            metadata: {
              userId: session.user.id,
            },
          });
          customerId = newCustomer.id;
        }

        // Attach customer to payment intent
        paymentIntentOptions.customer = customerId;
      } catch (customerError) {
        console.error("Error handling customer data:", customerError);
        // Continue without customer data if there's an error
      }
    }

    // Create a new PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create(
      paymentIntentOptions
    );

    // Return the client secret and payment intent ID to the client
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      success: true,
    });
  } catch (error: any) {
    console.error("Error creating payment intent:", error);

    // Return a proper error response with details when available
    return NextResponse.json(
      {
        error: error.message || "Failed to create payment intent",
        code: error.code || "unknown_error",
        success: false,
      },
      { status: error.statusCode || 500 }
    );
  }
}
