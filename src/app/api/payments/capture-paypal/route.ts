import { NextResponse } from "next/server";
import axios from "axios";
import { prisma } from "@/lib/db";

// PayPal API credentials
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_API_BASE =
  process.env.NODE_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

// Enhanced logging - helps with debugging
function logPayPalInfo(message: string, data?: any) {
  console.log(`[PayPal] ${message}`, data ? JSON.stringify(data, null, 2) : "");
}

function logPayPalError(message: string, error: any) {
  console.error(`[PayPal ERROR] ${message}`, error);

  // Log additional details if they exist
  if (error.response) {
    console.error("[PayPal ERROR Response]", {
      status: error.response.status,
      data: error.response.data,
      headers: error.response.headers,
    });
  }
}

/**
 * Generate an access token for PayPal API
 */
async function getPayPalAccessToken() {
  try {
    logPayPalInfo("Getting PayPal access token");

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error(
        "PayPal credentials are missing. Check your environment variables."
      );
    }

    const auth = Buffer.from(
      `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
    ).toString("base64");
    const response = await axios.post(
      `${PAYPAL_API_BASE}/v1/oauth2/token`,
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 10000, // 10 second timeout
      }
    );

    if (!response.data?.access_token) {
      throw new Error("PayPal did not return an access token");
    }

    logPayPalInfo("Successfully obtained PayPal access token");
    return response.data.access_token;
  } catch (error) {
    logPayPalError("Error getting PayPal access token:", error);
    throw new Error(
      "Failed to get PayPal access token. Please check server logs for details."
    );
  }
}

/**
 * Check the status of a PayPal order
 */
async function checkOrderStatus(orderID: string, accessToken: string) {
  try {
    logPayPalInfo(`Checking status for order: ${orderID}`);

    const response = await axios.get(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      }
    );

    logPayPalInfo(
      `Order status check successful for: ${orderID}`,
      response.data
    );
    return response.data;
  } catch (error) {
    logPayPalError(`Error checking PayPal order status: ${orderID}`, error);
    throw error;
  }
}

/**
 * Capture a PayPal payment
 */
async function capturePayment(orderID: string, accessToken: string) {
  try {
    logPayPalInfo(`Capturing payment for order: ${orderID}`);

    // Create a unique request ID to prevent duplicate captures
    const requestId = `capture_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 15)}`;

    // First check if the order is in a state that can be captured
    const orderStatus = await checkOrderStatus(orderID, accessToken);

    if (orderStatus.status === "COMPLETED") {
      logPayPalInfo(
        `Order ${orderID} is already completed, retrieving details`
      );
      return orderStatus; // Order was already captured
    }

    if (orderStatus.status !== "APPROVED") {
      throw new Error(
        `Order is not in an approved state. Current status: ${orderStatus.status}`
      );
    }

    const response = await axios.post(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`,
      {}, // Empty body as required by PayPal API
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "PayPal-Request-Id": requestId,
        },
        timeout: 15000, // 15 second timeout for captures
      }
    );

    logPayPalInfo(
      `Payment capture successful for order: ${orderID}`,
      response.data
    );
    return response.data;
  } catch (error: any) {
    // Check if this is a duplicate request error (order already captured)
    if (
      error.response?.status === 422 &&
      error.response?.data?.details?.[0]?.issue === "ORDER_ALREADY_CAPTURED"
    ) {
      logPayPalInfo(
        `Order ${orderID} was already captured, retrieving details`
      );

      // If already captured, get the order details to return the same structure
      return await checkOrderStatus(orderID, accessToken);
    }

    logPayPalError(
      `Error capturing PayPal payment for order: ${orderID}`,
      error
    );

    // Return more helpful error message based on PayPal error response
    if (error.response?.data?.details) {
      const paypalError = error.response.data.details[0] || {};
      throw new Error(
        `PayPal error: ${paypalError.issue || ""} - ${
          paypalError.description || "Unknown error"
        }`
      );
    }

    throw new Error(
      "Failed to capture PayPal payment: " + (error.message || "Unknown error")
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderID, items, shipping, summary, userId, orderNumber } = body;

    logPayPalInfo(`Processing payment capture request`, {
      orderID,
      orderNumber,
    });

    if (!orderID) {
      return NextResponse.json(
        { error: "PayPal order ID is required" },
        { status: 400 }
      );
    }

    // Add retry logic for better reliability
    let retries = 0;
    const maxRetries = 2;
    let accessToken;
    let captureData;

    while (retries <= maxRetries) {
      try {
        // Get PayPal access token
        accessToken = await getPayPalAccessToken();

        // Capture the payment
        captureData = await capturePayment(orderID, accessToken);

        // If we get here, the capture was successful
        break;
      } catch (error: any) {
        retries++;
        logPayPalError(`Attempt ${retries}/${maxRetries + 1} failed`, error);

        if (retries > maxRetries) {
          throw error; // Re-throw if we've used all our retries
        }

        // Wait before retrying - exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, retries))
        );
      }
    }

    // Verify capture status - should be COMPLETED or APPROVED
    if (!["COMPLETED", "APPROVED"].includes(captureData.status)) {
      throw new Error(`Payment not completed. Status: ${captureData.status}`);
    }

    // Get transaction ID from the capture data
    const capturePurchaseUnit = captureData.purchase_units?.[0];
    const captureDetails = capturePurchaseUnit?.payments?.captures?.[0];
    const captureId = captureDetails?.id;

    if (!captureId) {
      throw new Error("Failed to retrieve transaction ID from PayPal response");
    }

    // Format transaction ID to ensure it's compatible with order system
    const transactionId = `pp_${captureId}`;

    // If we have an order number, update the order with payment information
    if (orderNumber) {
      try {
        const order = await prisma.order.findUnique({
          where: { orderNumber },
        });

        if (order) {
          await prisma.order.update({
            where: { orderNumber },
            data: {
              paymentStatus: "PAID",
              status: "PROCESSING",
              metadata: {
                ...(order.metadata as object),
                paymentId: orderID,
                paymentDetails: {
                  provider: "paypal",
                  captureId: captureId,
                  transactionId: transactionId,
                  amount: captureDetails?.amount?.value,
                  currency: captureDetails?.amount?.currency_code,
                  paidAt: new Date().toISOString(),
                  payerEmail: captureData.payer?.email_address,
                  payerName: `${captureData.payer?.name?.given_name || ""} ${
                    captureData.payer?.name?.surname || ""
                  }`.trim(),
                  paypalOrderId: orderID,
                  captureStatus: captureDetails?.status,
                },
              },
            },
          });

          logPayPalInfo(
            `Successfully updated order ${orderNumber} with PayPal payment details`
          );
        } else {
          logPayPalInfo(`Order ${orderNumber} not found, skipping update`);
        }
      } catch (error) {
        // Log error but don't stop the process
        logPayPalError(
          `Failed to update order ${orderNumber} with payment details`,
          error
        );
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

    // Return a cleaner error message to the client
    const clientErrorMessage = errorMessage.includes("PayPal error:")
      ? errorMessage
      : "There was an issue processing your PayPal payment. Please try again or use a different payment method.";

    return NextResponse.json(
      {
        error: clientErrorMessage,
        code: statusCode,
        details: error.response?.data || null,
        success: false,
      },
      { status: statusCode }
    );
  }
}
