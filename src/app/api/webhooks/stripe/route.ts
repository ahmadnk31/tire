import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
  typescript: true,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = (await headersList).get("stripe-signature") as string;

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      // Add more event handlers as needed
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a success response
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

// Handle successful payment
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment succeeded for payment intent: ${paymentIntent.id}`);
  
  try {
    // Find order by payment intent ID
    const order = await prisma.order.findFirst({
      where: {
        metadata: {
          path: ["paymentId"],
          equals: paymentIntent.id
        }
      }
    });

    if (order) {
      // Update order status to PAID if it's still PENDING or PROCESSING
      if (order.status === "PENDING" || order.status === "PROCESSING") {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "PAID",
            status: "PROCESSING", // Move to processing since payment is confirmed
            metadata: {
              ...order.metadata as object,
              paymentDetails: {
                paymentIntentId: paymentIntent.id,
                paymentMethod: paymentIntent.payment_method_types[0],
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                paidAt: new Date().toISOString()
              }
            }
          }
        });
      }
    } else {
      console.warn(`No order found for payment intent: ${paymentIntent.id}`);
    }
  } catch (error) {
    console.error(`Error updating order for payment success: ${error}`);
  }
}

// Handle failed payment
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment failed for payment intent: ${paymentIntent.id}`);
  
  try {
    // Find order by payment intent ID
    const order = await prisma.order.findFirst({
      where: {
        metadata: {
          path: ["paymentId"],
          equals: paymentIntent.id
        }
      }
    });

    if (order) {
      // Update order status to FAILED if it's still PENDING or PROCESSING
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "FAILED",
          metadata: {
            ...order.metadata as object,
            paymentError: {
              code: paymentIntent.last_payment_error?.code,
              message: paymentIntent.last_payment_error?.message,
              time: new Date().toISOString()
            }
          }
        }
      });
    } else {
      console.warn(`No order found for failed payment intent: ${paymentIntent.id}`);
    }
  } catch (error) {
    console.error(`Error updating order for payment failure: ${error}`);
  }
}

// Handle refunded charge
async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log(`Charge refunded: ${charge.id}, payment_intent: ${charge.payment_intent}`);
  
  try {
    if (typeof charge.payment_intent === 'string') {
      // Find order by payment intent ID
      const order = await prisma.order.findFirst({
        where: {
          metadata: {
            path: ["paymentId"],
            equals: charge.payment_intent
          }
        }
      });

      if (order) {
        // Check if it's a full or partial refund
        const isFullRefund = charge.amount_refunded === charge.amount;
        
        // Update order status
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED",
            metadata: {
              ...order.metadata as object,
              refundDetails: {
                chargeId: charge.id,
                amountRefunded: charge.amount_refunded,
                currency: charge.currency,
                isFullRefund: isFullRefund,
                refundedAt: new Date().toISOString()
              }
            }
          }
        });
      } else {
        console.warn(`No order found for refunded charge: ${charge.id}, payment intent: ${charge.payment_intent}`);
      }
    }
  } catch (error) {
    console.error(`Error updating order for refund: ${error}`);
  }
}

// Handle completed checkout session
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log(`Checkout session completed: ${session.id}`);
  
  try {
    if (typeof session.payment_intent === 'string') {
      // Find order by payment intent ID stored in the session
      const order = await prisma.order.findFirst({
        where: {
          metadata: {
            path: ["paymentId"],
            equals: session.payment_intent
          }
        }
      });

      if (order) {
        // Update order with customer info from the session
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "PAID",
            status: "PROCESSING",
            metadata: {
              ...order.metadata as object,
              checkoutSession: {
                sessionId: session.id,
                customerEmail: session.customer_details?.email,
                customerName: session.customer_details?.name,
                completedAt: new Date().toISOString()
              }
            }
          }
        });
      } else {
        console.warn(`No order found for checkout session: ${session.id}`);
      }
    }
  } catch (error) {
    console.error(`Error updating order for checkout session: ${error}`);
  }
}