import { NextResponse } from "next/server";
import axios from "axios";
import { prisma } from "@/lib/db";

// PayPal API credentials
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_API_BASE = process.env.NODE_ENV === "production"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

// Enhanced logging - helps with debugging
function logPayPalInfo(message: string, data?: any) {
  console.log(`[PayPal] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

function logPayPalError(message: string, error: any) {
  console.error(`[PayPal ERROR] ${message}`, error);
  
  // Log additional details if they exist
  if (error.response) {
    console.error('[PayPal ERROR Response]', {
      status: error.response.status,
      data: error.response.data,
      headers: error.response.headers
    });
  }
}

/**
 * Generate an access token for PayPal API
 */
async function getPayPalAccessToken() {
  try {
    logPayPalInfo('Getting PayPal access token');
    
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error("PayPal credentials are missing. Check your environment variables.");
    }
    
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
    
    logPayPalInfo('Successfully obtained PayPal access token');
    return response.data.access_token;
  } catch (error) {
    logPayPalError("Error getting PayPal access token:", error);
    throw new Error("Failed to get PayPal access token. Please check server logs for details.");
  }
}

/**
 * Capture a PayPal payment
 */
async function capturePayment(orderID: string, accessToken: string) {
  try {
    logPayPalInfo(`Capturing payment for order: ${orderID}`);
    
    const response = await axios.post(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "PayPal-Request-Id": `capture_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`, // Unique ID to prevent duplicate captures
        },
      }
    );
    
    logPayPalInfo(`Payment capture successful for order: ${orderID}`, response.data);
    return response.data;
  } catch (error: any) {
    logPayPalError(`Error capturing PayPal payment for order: ${orderID}`, error);
    
    // Return more helpful error message based on PayPal error response
    if (error.response?.data?.details) {
      const paypalError = error.response.data.details[0] || {};
      throw new Error(`PayPal error: ${paypalError.issue || ''} - ${paypalError.description || 'Unknown error'}`);
    }
    
    throw new Error("Failed to capture PayPal payment: " + (error.message || 'Unknown error'));
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderID, items, shipping, summary, userId, orderNumber } = body;

    logPayPalInfo(`Processing payment capture request`, { orderID, orderNumber });

    if (!orderID) {
      return NextResponse.json(
        { error: "PayPal order ID is required" },
        { status: 400 }
      );
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Capture the payment
    const captureData = await capturePayment(orderID, accessToken);

    // Verify capture status
    if (captureData.status !== "COMPLETED") {
      throw new Error(`Payment not completed. Status: ${captureData.status}`);
    }

    // Get transaction ID from the capture data
    const captureId = captureData.purchase_units[0]?.payments?.captures[0]?.id;
    
    if (!captureId) {
      throw new Error("Failed to retrieve transaction ID from PayPal response");
    }

    // Format transaction ID to ensure it's compatible with order system
    const transactionId = `pp_${captureId}`;
    
    // If we have an order number, update the order with payment information
    if (orderNumber) {
      try {
        const order = await prisma.order.findUnique({
          where: { orderNumber }
        });
        
        if (order) {
          await prisma.order.update({
            where: { orderNumber },
            data: {
              paymentStatus: "PAID",
              status: "PROCESSING",
              metadata: {
                ...order.metadata as object,
                paymentId: orderID,
                paymentDetails: {
                  provider: "paypal",
                  captureId: captureId,
                  transactionId: transactionId,
                  amount: captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value,
                  currency: captureData.purchase_units[0]?.payments?.captures[0]?.amount?.currency_code,
                  paidAt: new Date().toISOString(),
                  payerEmail: captureData.payer?.email_address,
                  payerName: `${captureData.payer?.name?.given_name || ''} ${captureData.payer?.name?.surname || ''}`.trim(),
                }
              }
            }
          });
          
          logPayPalInfo(`Successfully updated order ${orderNumber} with PayPal payment details`);
        } else {
          logPayPalInfo(`Order ${orderNumber} not found, skipping update`);
        }
      } catch (error) {
        // Log error but don't stop the process
        logPayPalError(`Failed to update order ${orderNumber} with payment details`, error);
      }
    }

    // Return success response with transaction ID
    return NextResponse.json({
      success: true,
      transactionId,
      captureData,
    });
  } catch (error: any) {
    logPayPalError("Error processing PayPal payment:", error);
    
    // Detailed error handling for client
    const errorMessage = error.message || "Failed to process PayPal payment";
    const statusCode = error.response?.status || 500;
    
    return NextResponse.json(
      { 
        error: errorMessage,
        code: statusCode,
        details: error.response?.data || null
      },
      { status: statusCode }
    );
  }
}