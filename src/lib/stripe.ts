import { Stripe } from "stripe";

// Get the Stripe API key from environment variable
const stripeApiKey = process.env.STRIPE_SECRET_KEY || "";

// Function to create a Stripe client
const createStripeClient = () => {
  // During build time, this can be undefined or empty
  // In that case, we want to return a dummy client that won't be used
  if (!stripeApiKey || stripeApiKey === "") {
    // For build time only - won't be used in actual runtime
    console.warn("Stripe API key not found. Using mock client for build.");

    // Return a mock object that won't throw during build
    return {
      paymentIntents: {
        create: () =>
          Promise.resolve({ client_secret: "mock_secret", id: "mock_id" }),
      },
    } as unknown as Stripe;
  }

  // Real Stripe client for runtime
  return new Stripe(stripeApiKey, {
    apiVersion: "2025-03-31.basil",
    typescript: true,
  });
};

// Initialize Stripe
const stripe = createStripeClient();

export { stripe };
