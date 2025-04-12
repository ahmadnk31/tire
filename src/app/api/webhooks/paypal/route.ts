import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import axios from "axios";

// PayPal webhook secret from environment variable
const PAYPAL_WEBHOOK_SECRET = process.env.PAYPAL_WEBHOOK_SECRET!;
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_API_BASE = process.env.NODE_ENV === "production"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

// Enhanced logging for PayPal webhook
function logWebhookInfo(message: string, data?: any) {
  console.log(`[PayPal Webhook] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

function logWebhookError(message: string, error: any) {
  console.error(`[PayPal Webhook ERROR] ${message}`, error);
  if (error.response) {
    console.error('[PayPal Webhook ERROR Response]', {
      status: error.response.status,
      data: error.response.data
    });
  }
}

// Get PayPal access token for API calls
async function getPayPalAccessToken() {
  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
    const response = await axios.post(
      `${PAYPAL_API_BASE}/v1/oauth2/token`,
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    logWebhookError("Error getting PayPal access token:", error);
    throw new Error("Failed to get PayPal access token");
  }
}

// Verify webhook signature with PayPal
async function verifyWebhookSignature(
  body: string,
  transmissionId: string,
  timestamp: string,
  signature: string,
  webhookId: string
) {
  try {
    const accessToken = await getPayPalAccessToken();
    
    const response = await axios.post(
      `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
      {
        transmission_id: transmissionId,
        transmission_time: timestamp,
        cert_url: "https://api.paypal.com/v1/notifications/certs/CERT-360caa42-fca2a594-df8cd2d7",
        auth_algo: "SHA256withRSA",
        transmission_sig: signature,
        webhook_id: webhookId,
        webhook_event: JSON.parse(body)
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
      }
    );
    
    return response.data.verification_status === "SUCCESS";
  } catch (error) {
    logWebhookError("Error verifying webhook signature:", error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headersList = headers();
    
    // Get PayPal webhook signature headers
    const transmissionId = (await headersList).get('paypal-transmission-id');
    const timestamp = (await headersList).get('paypal-transmission-time');
    const webhookSignature = (await headersList).get('paypal-transmission-sig');
    const certUrl = (await headersList).get('paypal-cert-url');
    
    // Parse the webhook event early to get the event type for logging
    const webhookBody = JSON.parse(body);
    const eventType = webhookBody.event_type;
    
    logWebhookInfo(`Received PayPal webhook event: ${eventType}`, {
      resource_type: webhookBody.resource_type,
      resource_id: webhookBody.resource?.id
    });
    
    // Verify webhook signature if in production
    if (process.env.NODE_ENV === 'production') {
      // Basic validation of required headers
      if (!transmissionId || !timestamp || !webhookSignature || !certUrl) {
        logWebhookError('Missing PayPal webhook signature headers', {
          transmissionId,
          timestamp,
          webhookSignature: !!webhookSignature,
          certUrl
        });
        
        return NextResponse.json(
          { error: "Invalid webhook signature headers" },
          { status: 400 }
        );
      }
      
      // Verify the signature using PayPal's API
      const isVerified = await verifyWebhookSignature(
        body,
        transmissionId,
        timestamp,
        webhookSignature,
        PAYPAL_WEBHOOK_SECRET
      );
      
      if (!isVerified) {
        logWebhookError('Invalid webhook signature', {
          eventType,
          resourceId: webhookBody.resource?.id
        });
        
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 401 }
        );
      }
      
      logWebhookInfo('Webhook signature verified successfully');
    }
    
    // Handle different event types
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCaptureCompleted(webhookBody);
        break;
        
      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentCaptureDenied(webhookBody);
        break;
        
      case 'PAYMENT.CAPTURE.REFUNDED':
        await handlePaymentCaptureRefunded(webhookBody);
        break;
      
      case 'PAYMENT.CAPTURE.PENDING':
        await handlePaymentCapturePending(webhookBody);
        break;
        
      case 'CHECKOUT.ORDER.COMPLETED':
        await handleCheckoutOrderCompleted(webhookBody);
        break;
        
      case 'CHECKOUT.ORDER.APPROVED':
        await handleCheckoutOrderApproved(webhookBody);
        break;
        
      case 'CHECKOUT.ORDER.PROCESSED':
        await handleCheckoutOrderProcessed(webhookBody);
        break;
        
      case 'CUSTOMER.DISPUTE.CREATED':
        await handleDisputeCreated(webhookBody);
        break;
        
      case 'CUSTOMER.DISPUTE.RESOLVED':
        await handleDisputeResolved(webhookBody);
        break;
        
      default:
        logWebhookInfo(`Unhandled PayPal event type: ${eventType}`);
    }
    
    // Return a success response to PayPal
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    logWebhookError("Error processing PayPal webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

// Handle successful payment capture
async function handlePaymentCaptureCompleted(webhookEvent: any) {
  const resource = webhookEvent.resource;
  const captureId = resource.id;
  const paymentId = resource.supplementary_data?.related_ids?.order_id;
  
  if (!paymentId) {
    logWebhookInfo('No payment/order ID found in the PayPal webhook event', {
      captureId, 
      resourceType: webhookEvent.resource_type
    });
    return;
  }
  
  const transactionId = `pp_${captureId}`;
  
  try {
    // Try to find order by PayPal payment ID or transaction ID
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          {
            metadata: {
              path: ["paymentId"],
              equals: paymentId
            }
          },
          {
            metadata: {
              path: ["paymentDetails", "transactionId"],
              equals: transactionId
            }
          },
          {
            metadata: {
              path: ["paymentDetails", "captureId"],
              equals: captureId
            }
          }
        ]
      }
    });
    
    if (order) {
      logWebhookInfo(`Found order for PayPal payment: ${order.id}, orderNumber: ${order.orderNumber}`);
      
      // Update order status to PAID if it's still PENDING or PROCESSING
      if (order.status === "PENDING" || order.status === "PROCESSING" || order.paymentStatus !== "PAID") {
        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "PAID",
            status: "PROCESSING", // Move to processing since payment is confirmed
            metadata: {
              ...order.metadata as object,
              paymentDetails: {
                paymentId: paymentId,
                captureId: captureId,
                transactionId: transactionId,
                provider: "paypal",
                amount: resource.amount.value,
                currency: resource.amount.currency_code,
                paidAt: new Date().toISOString(),
                payerEmail: resource.payer?.email_address,
                status: resource.status,
                finalCapture: resource.final_capture || false
              }
            }
          }
        });
        
        logWebhookInfo(`Updated order ${order.id} payment status to PAID`);
        
        // Send payment confirmation email here if needed
      } else {
        logWebhookInfo(`Order ${order.id} already processed, status: ${order.status}, paymentStatus: ${order.paymentStatus}`);
      }
    } else {
      logWebhookError(`No order found for PayPal payment`, {
        paymentId, 
        captureId, 
        transactionId
      });
    }
  } catch (error) {
    logWebhookError(`Error updating order for PayPal payment success:`, error);
  }
}

// Handle denied payment capture
async function handlePaymentCaptureDenied(webhookEvent: any) {
  const resource = webhookEvent.resource;
  const captureId = resource.id;
  const paymentId = resource.supplementary_data?.related_ids?.order_id;
  
  if (!paymentId) {
    logWebhookInfo('No payment/order ID found in the PayPal webhook event');
    return;
  }
  
  try {
    // Find order by PayPal payment ID
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          {
            metadata: {
              path: ["paymentId"],
              equals: paymentId
            }
          },
          {
            metadata: {
              path: ["paymentDetails", "captureId"],
              equals: captureId
            }
          }
        ]
      }
    });
    
    if (order) {
      // Update order status to FAILED
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "FAILED",
          metadata: {
            ...order.metadata as object,
            paymentError: {
              reason: resource.status_details?.reason || 'Payment capture denied',
              time: new Date().toISOString(),
              details: JSON.stringify(resource.status_details || {}),
              status: resource.status
            }
          }
        }
      });
      
      logWebhookInfo(`Updated order ${order.id} status to FAILED due to denied payment`);
      
      // Send payment failure notification here if needed
    } else {
      logWebhookError(`No order found for denied PayPal payment`, { paymentId, captureId });
    }
  } catch (error) {
    logWebhookError(`Error updating order for PayPal payment denial:`, error);
  }
}

// Handle payment capture pending
async function handlePaymentCapturePending(webhookEvent: any) {
  const resource = webhookEvent.resource;
  const captureId = resource.id;
  const paymentId = resource.supplementary_data?.related_ids?.order_id;
  const pendingReason = resource.status_details?.reason;
  
  if (!paymentId) {
    logWebhookInfo('No payment/order ID found in the pending payment webhook event');
    return;
  }
  
  try {
    // Find order by PayPal payment ID
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          {
            metadata: {
              path: ["paymentId"],
              equals: paymentId
            }
          },
          {
            metadata: {
              path: ["paymentDetails", "captureId"],
              equals: captureId
            }
          }
        ]
      }
    });
    
    if (order) {
      // Update order status to PENDING
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PENDING",
          status: "PENDING",
          metadata: {
            ...order.metadata as object,
            paymentPending: {
              reason: pendingReason || 'unknown',
              captureId: captureId,
              time: new Date().toISOString(),
              status: resource.status,
              details: JSON.stringify(resource.status_details || {})
            }
          }
        }
      });
      
      logWebhookInfo(`Updated order ${order.id} status to PENDING payment. Reason: ${pendingReason}`);
    } else {
      logWebhookError(`No order found for pending PayPal payment`, { paymentId, captureId });
    }
  } catch (error) {
    logWebhookError(`Error updating order for PayPal payment pending:`, error);
  }
}

// Handle refunded payment
async function handlePaymentCaptureRefunded(webhookEvent: any) {
  const resource = webhookEvent.resource;
  const refundId = resource.id;
  const captureId = resource.links.find((link: any) => link.rel === "up")?.href.split('/').pop();
  
  if (!captureId) {
    logWebhookInfo('No capture ID found in the PayPal refund webhook event', { refundId });
    return;
  }
  
  try {
    // Find order by PayPal capture ID in metadata
    const order = await prisma.order.findFirst({
      where: {
        metadata: {
          path: ["paymentDetails", "captureId"],
          equals: captureId
        }
      }
    });
    
    if (order) {
      // Check if it's a full or partial refund
      const isFullRefund = resource.amount.value === (order.metadata as any)?.paymentDetails?.amount;
      
      // Update order status
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED",
          metadata: {
            ...order.metadata as object,
            refundDetails: {
              refundId: refundId,
              captureId: captureId,
              amountRefunded: resource.amount.value,
              currency: resource.amount.currency_code,
              isFullRefund: isFullRefund,
              refundedAt: new Date().toISOString(),
              status: resource.status,
              reason: resource.status_details?.reason
            }
          }
        }
      });
      
      logWebhookInfo(`Updated order ${order.id} status for ${isFullRefund ? 'full' : 'partial'} refund`);
      
      // Send refund notification email here if needed
    } else {
      logWebhookError(`No order found for refunded PayPal payment with capture ID`, { captureId, refundId });
    }
  } catch (error) {
    logWebhookError(`Error updating order for PayPal refund:`, error);
  }
}

// Handle completed checkout order
async function handleCheckoutOrderCompleted(webhookEvent: any) {
  const resource = webhookEvent.resource;
  const orderId = resource.id;
  
  try {
    // Find order by PayPal order ID
    const order = await prisma.order.findFirst({
      where: {
        metadata: {
          path: ["paymentId"],
          equals: orderId
        }
      }
    });
    
    if (order) {
      // Extract payment capture ID if available
      let captureId = null;
      if (resource.purchase_units && 
          resource.purchase_units[0] && 
          resource.purchase_units[0].payments && 
          resource.purchase_units[0].payments.captures && 
          resource.purchase_units[0].payments.captures[0]) {
        captureId = resource.purchase_units[0].payments.captures[0].id;
      }
      
      // Update order with customer info from the checkout session
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          status: "PROCESSING",
          metadata: {
            ...order.metadata as object,
            paypalCheckout: {
              orderId: orderId,
              captureId: captureId,
              customerEmail: resource.payer?.email_address,
              customerName: `${resource.payer?.name?.given_name || ''} ${resource.payer?.name?.surname || ''}`.trim(),
              completedAt: new Date().toISOString(),
              status: resource.status,
              shippingAddress: resource.shipping || {},
              payerId: resource.payer?.payer_id
            }
          }
        }
      });
      
      logWebhookInfo(`Updated order ${order.id} with checkout completion details`);
    } else {
      logWebhookError(`No order found for completed PayPal order:`, { orderId });
    }
  } catch (error) {
    logWebhookError(`Error updating order for PayPal checkout completion:`, error);
  }
}

// Handle approved checkout order
async function handleCheckoutOrderApproved(webhookEvent: any) {
  // This could be handled client-side or we could create an order record here
  const resource = webhookEvent.resource;
  const orderId = resource.id;
  
  logWebhookInfo('PayPal order approved, waiting for completion', { orderId });
  
  // For now, we'll just log it, but you could implement logic to create an order
  // if it doesn't already exist in your database
}

// Handle processed checkout order
async function handleCheckoutOrderProcessed(webhookEvent: any) {
  const resource = webhookEvent.resource;
  const orderId = resource.id;
  
  try {
    // Find order by PayPal order ID
    const order = await prisma.order.findFirst({
      where: {
        metadata: {
          path: ["paymentId"],
          equals: orderId
        }
      }
    });
    
    if (order) {
      // Update order with processing status
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "PROCESSING",
          metadata: {
            ...order.metadata as object,
            paypalProcessing: {
              processedAt: new Date().toISOString(),
              status: resource.status
            }
          }
        }
      });
      
      logWebhookInfo(`Updated order ${order.id} to processing status`);
    } else {
      logWebhookError(`No order found for processed PayPal order:`, { orderId });
    }
  } catch (error) {
    logWebhookError(`Error updating order for PayPal order processing:`, error);
  }
}

// Handle customer dispute created
async function handleDisputeCreated(webhookEvent: any) {
  const resource = webhookEvent.resource;
  const disputeId = resource.id;
  const transactionId = resource.disputed_transactions?.[0]?.seller_transaction_id;
  
  if (!transactionId) {
    logWebhookInfo('No transaction ID found in the dispute', { disputeId });
    return;
  }
  
  try {
    // First try to find by capture ID which might match the transaction ID
    let order = await prisma.order.findFirst({
      where: {
        metadata: {
          path: ["paymentDetails", "captureId"],
          equals: transactionId
        }
      }
    });
    
    // If not found, try another approach
    if (!order) {
      // Try with the formatted transaction ID
      const formattedId = `pp_${transactionId}`;
      order = await prisma.order.findFirst({
        where: {
          metadata: {
            path: ["paymentDetails", "transactionId"],
            equals: formattedId
          }
        }
      });
    }
    
    if (order) {
      // Update order with dispute info
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "DISPUTED",
          metadata: {
            ...order.metadata as object,
            dispute: {
              disputeId: disputeId,
              transactionId: transactionId,
              reason: resource.reason,
              status: resource.status,
              disputeAmount: resource.dispute_amount,
              disputeCreatedAt: new Date().toISOString(),
              sellerResponseDueDate: resource.seller_response_due_date
            }
          }
        }
      });
      
      logWebhookInfo(`Updated order ${order.id} with dispute information`);
      
      // Send dispute notification to admin
    } else {
      logWebhookError(`No order found for disputed transaction:`, { transactionId, disputeId });
    }
  } catch (error) {
    logWebhookError(`Error updating order for PayPal dispute:`, error);
  }
}

// Handle customer dispute resolved
async function handleDisputeResolved(webhookEvent: any) {
  const resource = webhookEvent.resource;
  const disputeId = resource.id;
  const outcome = resource.dispute_outcome?.outcome;
  
  try {
    // Find order by dispute ID in metadata
    const order = await prisma.order.findFirst({
      where: {
        metadata: {
          path: ["dispute", "disputeId"],
          equals: disputeId
        }
      }
    });
    
    if (order) {
      // Determine new status based on dispute outcome
      let newStatus = order.status;
      let newPaymentStatus = order.paymentStatus;
      
      if (outcome === "RESOLVED_BUYER_FAVOUR") {
        newPaymentStatus = "REFUNDED";
      } else if (outcome === "RESOLVED_SELLER_FAVOUR") {
        newStatus = "PROCESSING"; // Or whatever the previous status was before the dispute
        newPaymentStatus = "PAID";
      }
      
      // Update order with dispute resolution
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: newStatus,
          paymentStatus: newPaymentStatus,
          metadata: {
            ...order.metadata as object,
            disputeResolution: {
              disputeId: disputeId,
              outcome: outcome,
              resolvedAt: new Date().toISOString(),
              resolution: resource.dispute_outcome?.dispute_amount?.value > 0 
                ? "REFUNDED" 
                : "SELLER_PROTECTED",
              amount: resource.dispute_outcome?.dispute_amount
            }
          }
        }
      });
      
      logWebhookInfo(`Updated order ${order.id} with dispute resolution. Outcome: ${outcome}`);
      
      // Send dispute resolution notification
    } else {
      logWebhookError(`No order found for resolved dispute:`, { disputeId });
    }
  } catch (error) {
    logWebhookError(`Error updating order for PayPal dispute resolution:`, error);
  }
}