import { sendLocalizedEmail } from './email-service';

/**
 * Send an order confirmation email to a customer in their preferred language
 * 
 * @param email Customer's email address
 * @param name Customer's name
 * @param orderDetails Order details including items, addresses, etc.
 * @param locale Customer's preferred locale (e.g., 'en' or 'nl')
 * @returns Promise resolving to boolean indicating success/failure
 */
export async function sendOrderConfirmationEmail({
  email,
  name,
  orderDetails,
  locale = 'en',
}: {
  email: string;
  name: string;
  orderDetails: {
    orderNumber: string;
    orderDate: string;
    orderTotal: string;
    orderItems: Array<{
      name: string;
      quantity: number;
      price: string;
    }>;
    shippingAddress: {
      name: string;
      address: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    paymentMethod: string;
    trackingUrl?: string;
  };
  locale?: string;
}): Promise<boolean> {
  // Generate tracking URL if not provided
  const trackingUrl = orderDetails.trackingUrl || 
    `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/account/orders/${orderDetails.orderNumber}`;
  
  return sendLocalizedEmail({
    to: email,
    subject: 'subjects.orderConfirmation',
    template: 'orderConfirmation',
    templateData: {
      orderNumber: orderDetails.orderNumber,
      orderDate: orderDetails.orderDate,
      orderTotal: orderDetails.orderTotal,
      orderItems: orderDetails.orderItems,
      shippingAddress: orderDetails.shippingAddress,
      paymentMethod: orderDetails.paymentMethod,
      trackingUrl,
      locale,
    },
    locale,
  });
}

/**
 * Send a welcome email to a new user in their preferred language
 * 
 * @param email User's email address
 * @param name User's name
 * @param locale User's preferred locale (e.g., 'en' or 'nl')
 * @returns Promise resolving to boolean indicating success/failure
 */
export async function sendWelcomeEmail({
  email,
  name,
  locale = 'en',
}: {
  email: string;
  name: string;
  locale?: string;
}): Promise<boolean> {
  // Generate login URL with user's locale
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const loginUrl = `${baseUrl}/${locale}/login`;
  
  return sendLocalizedEmail({
    to: email,
    subject: 'subjects.welcome',
    template: 'welcome',
    templateData: {
      userName: name,
      loginUrl,
      baseUrl: baseUrl,
      locale,
    },
    locale,
  });
}
