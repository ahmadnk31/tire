/**
 * Supported email template types
 */
export type EmailTemplate = 
  | "verification" 
  | "passwordReset" 
  | "welcome"
  | "orderConfirmation";

/**
 * Base template data that all templates receive
 */
export interface BaseTemplateData {
  locale: string;
}

/**
 * Data for verification email template
 */
export interface VerificationTemplateData extends BaseTemplateData {
  userName: string;
  verificationUrl: string;
  expiresInHours?: number;
}

/**
 * Data for password reset email template
 */
export interface PasswordResetTemplateData extends BaseTemplateData {
  userName: string;
  resetUrl: string;
  expiresInHours?: number;
}

/**
 * Data for welcome email template
 */
export interface WelcomeTemplateData extends BaseTemplateData {
  userName: string;
  loginUrl: string;
}

/**
 * Data for order confirmation email template
 */
export interface OrderConfirmationTemplateData extends BaseTemplateData {
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
}

/**
 * Union of all template data types
 */
export type TemplateData = 
  | VerificationTemplateData
  | PasswordResetTemplateData
  | WelcomeTemplateData
  | OrderConfirmationTemplateData;
