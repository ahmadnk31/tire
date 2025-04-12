import { Stripe } from 'stripe';

// Initialize Stripe with your secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: "2025-03-31.basil",
    typescript: true,
});

export { stripe };