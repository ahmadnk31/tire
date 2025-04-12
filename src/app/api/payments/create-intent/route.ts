import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency = "usd", metadata = {} } = body;

    // Validate the input
    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount provided" },
        { status: 400 }
      );
    }

    // Create a new PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata,
    });

    // Return the client secret and payment intent ID to the client
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    
    // Return a proper error response
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}