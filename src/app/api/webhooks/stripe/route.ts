import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

// Get Stripe API Key
const stripeApiKey = process.env.STRIPE_SECRET_KEY || "";
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

// Initialize Stripe with a safe approach that works during build
let stripe: Stripe;

if (!stripeApiKey) {
  // Mock implementation for build time
  stripe = {
    webhooks: {
      constructEvent: () => ({ type: "mock", data: { object: {} } } as Stripe.Event),
    },
    paymentIntents: {
      create: () => Promise.resolve({} as any),
    },
  } as unknown as unknown as Stripe;
} else {
  // Real implementation for runtime
  stripe = new Stripe(stripeApiKey, {
    apiVersion: "2025-03-31.basil",
    typescript: true,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = (await headersList).get("stripe-signature") as string;

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      // Only validate signature if we have both a signature and webhook secret
      if (signature && webhookSecret) {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } else {
        // For webhook testing or when secrets aren't available
        try {
          event = JSON.parse(body) as Stripe.Event;
        } catch (e) {
          throw new Error(
            "Invalid webhook payload and missing signature/secret"
          );
        }
      }
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
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

// Send confirmation email for successful payment
import {
  getOrderConfirmationHtml,
  getOrderConfirmationText,
} from "@/lib/email/order-templates";
import { sendEmail } from "@/lib/email/aws-ses";

async function sendOrderConfirmationEmail(
  order: any,
  paymentIntent: Stripe.PaymentIntent
) {
  try {
    // Get customer details from payment intent or order metadata
    let customerEmail = "";
    let customerName = "";

    if (paymentIntent.receipt_email) {
      customerEmail = paymentIntent.receipt_email;
    } else if (order.shippingEmail) {
      customerEmail = order.shippingEmail;
    } else if (order.metadata && (order.metadata as any).customer) {
      try {
        const customerData = JSON.parse((order.metadata as any).customer);
        customerEmail = customerData.email;
        customerName = customerData.name;
      } catch (e) {
        console.error("Error parsing customer data from metadata:", e);
      }
    }

    if (!customerEmail) {
      console.error("No customer email found for order:", order.orderNumber);
      return;
    }

    // Format order items for the email template
    const items =
      order.orderItems?.map((item: any) => ({
        name: item.name || item.productName || "Product",
        quantity: item.quantity || 1,
        price: item.price || item.unitPrice || 0,
        image: item.image || undefined,
      })) || [];

    // Prepare email content using our template
    const templateParams = {
      orderNumber: order.orderNumber,
      orderDate: new Date().toLocaleDateString(),
      customerName: customerName || "Valued Customer",
      orderTotal: (paymentIntent.amount / 100).toFixed(2),
      currency: paymentIntent.currency.toUpperCase(),
      items: items,
      shippingAddress: order.shippingAddress || {},
      trackingNumber: order.trackingNumber || "Not yet available",
      estimatedDelivery: order.estimatedDelivery || "Processing",
    };

    // Generate email content from our templates
    const htmlBody = getOrderConfirmationHtml(templateParams);
    const textBody = getOrderConfirmationText(templateParams);

    // Send email using our AWS SES integration
    await sendEmail({
      to: customerEmail,
      subject: `Order Confirmation #${order.orderNumber}`,
      htmlBody,
      textBody,
    });

    console.log(
      `Order confirmation email sent to ${customerEmail} for order #${order.orderNumber}`
    );
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    // Don't throw error - we don't want to fail the webhook if email fails
  }
}

// Handle successful payment
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  console.log(`Payment succeeded for payment intent: ${paymentIntent.id}`);

  try {
    // Find order by payment intent ID
    const order = await prisma.order.findFirst({
      where: {
        metadata: {
          path: ["paymentId"],
          equals: paymentIntent.id,
        },
      },
      include: {
        user: true, // Include user info if associated with the order
        orderItems: true,
      },
    });

    if (order) {
      // Update order status to PAID if it's still PENDING or PROCESSING
      if (order.status === "PENDING" || order.status === "PROCESSING") {
        // Get user info from payment intent if available
        let userInfo = {};
        if (paymentIntent.shipping) {
          userInfo = {
            customerName: paymentIntent.shipping.name,
            customerPhone: paymentIntent.shipping.phone,
            shippingAddress: {
              ...paymentIntent.shipping.address,
              recipient: paymentIntent.shipping.name,
              phone: paymentIntent.shipping.phone,
            },
          };
        }

        // Extract more customer details if available
        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "PAID",
            status: "PROCESSING", // Move to processing since payment is confirmed
            metadata: {
              ...(order.metadata as object),
              paymentDetails: {
                paymentIntentId: paymentIntent.id,
                paymentMethod: paymentIntent.payment_method_types[0],
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                paidAt: new Date().toISOString(),
                receiptEmail: paymentIntent.receipt_email,
                ...userInfo,
              },
            },
          },
        });
      }
      await sendOrderConfirmationEmail(order, paymentIntent);
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
          equals: paymentIntent.id,
        },
      },
    });

    if (order) {
      // Update order status to FAILED if it's still PENDING or PROCESSING
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "FAILED",
          metadata: {
            ...(order.metadata as object),
            paymentError: {
              code: paymentIntent.last_payment_error?.code,
              message: paymentIntent.last_payment_error?.message,
              time: new Date().toISOString(),
            },
          },
        },
      });
    } else {
      console.warn(
        `No order found for failed payment intent: ${paymentIntent.id}`
      );
    }
  } catch (error) {
    console.error(`Error updating order for payment failure: ${error}`);
  }
}

// Handle refunded charge
async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log(
    `Charge refunded: ${charge.id}, payment_intent: ${charge.payment_intent}`
  );

  try {
    if (typeof charge.payment_intent === "string") {
      // Find order by payment intent ID
      const order = await prisma.order.findFirst({
        where: {
          metadata: {
            path: ["paymentId"],
            equals: charge.payment_intent,
          },
        },
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
              ...(order.metadata as object),
              refundDetails: {
                chargeId: charge.id,
                amountRefunded: charge.amount_refunded,
                currency: charge.currency,
                isFullRefund: isFullRefund,
                refundedAt: new Date().toISOString(),
              },
            },
          },
        });
      } else {
        console.warn(
          `No order found for refunded charge: ${charge.id}, payment intent: ${charge.payment_intent}`
        );
      }
    }
  } catch (error) {
    console.error(`Error updating order for refund: ${error}`);
  }
}

// Handle completed checkout session
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  console.log(`Checkout session completed: ${session.id}`);

  try {
    if (typeof session.payment_intent === "string") {
      // Find order by payment intent ID stored in the session
      const order = await prisma.order.findFirst({
        where: {
          metadata: {
            path: ["paymentId"],
            equals: session.payment_intent,
          },
        },
      });

      if (order) {
        // Update order with customer info from the session
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "PAID",
            status: "PROCESSING",
            metadata: {
              ...(order.metadata as object),
              checkoutSession: {
                sessionId: session.id,
                customerEmail: session.customer_details?.email,
                customerName: session.customer_details?.name,
                completedAt: new Date().toISOString(),
              },
            },
          },
        });
      } else {
        console.warn(`No order found for checkout session: ${session.id}`);
      }
    }
  } catch (error) {
    console.error(`Error updating order for checkout session: ${error}`);
  }
}
