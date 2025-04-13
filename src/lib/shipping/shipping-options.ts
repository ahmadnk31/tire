/**
 * Centralized shipping options configuration
 * This file serves as a single source of truth for shipping option definitions
 * throughout the application.
 */

import { ShippingOption } from "@/contexts/cart-context";

/**
 * Default shipping options to use when API calls fail or are not available
 */
export const DEFAULT_SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: "standard",
    name: "Standard Shipping",
    price: 9.99,
    description: "3-5 business days",
    estimatedDelivery: "Estimated delivery: 3-5 business days",
    provider: "default",
    serviceLevel: "STANDARD"
  },
  {
    id: "express",
    name: "Express Shipping",
    price: 19.99,
    description: "1-2 business days",
    estimatedDelivery: "Estimated delivery: 1-2 business days",
    provider: "default",
    serviceLevel: "EXPRESS"
  },
  {
    id: "overnight",
    name: "Overnight Delivery",
    price: 29.99,
    description: "Next day delivery",
    estimatedDelivery: "Estimated delivery: Next business day",
    provider: "default",
    serviceLevel: "PRIORITY"
  }
];

/**
 * Helper function to convert decimal prices to cents for payment processors
 * @param options Array of shipping options with prices in decimal format
 * @returns Array of shipping options with prices in cents
 */
export const convertPricesToCents = (options: ShippingOption[]): Array<{
  id: string;
  label: string;
  detail: string;
  amount: number;
}> => {
  return options.map(option => ({
    id: option.id,
    label: option.name,
    detail: option.description || "",
    amount: Math.round(option.price * 100)
  }));
};

/**
 * Get the default shipping option (first option in the list)
 */
export const getDefaultShippingOption = (): ShippingOption => {
  return DEFAULT_SHIPPING_OPTIONS[0];
};
