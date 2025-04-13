/**
 * Shipping service types standardized across all providers
 */
export enum ShippingServiceType {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  PRIORITY = 'PRIORITY',
  ECONOMY = 'ECONOMY'
}

/**
 * Tracking status standardized across all providers
 */
export enum TrackingStatus {
  CREATED = 'CREATED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  EXCEPTION = 'EXCEPTION',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Simple address interface for validation
 */
export interface Address {
  street: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  countryCode: string;
}

/**
 * Shipping address details
 */
export interface ShippingAddress {
  contactName: string;
  companyName?: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
}

/**
 * Package details for shipping
 */
export interface PackageDetails {
  weight: number;
  length: number;
  width: number;
  height: number;
  description?: string;
}

/**
 * Rate request parameters
 */
export interface RateRequest {
  shipperAddress: ShippingAddress;
  recipientAddress: ShippingAddress;
  packages: PackageDetails[];
  serviceType?: ShippingServiceType;
  isResidential?: boolean;
}

/**
 * Rate quote response
 */
export interface RateQuote {
  providerName: string;
  serviceType: ShippingServiceType;
  deliveryDate?: Date;
  totalAmount: number;
  currency: string;
  transitDays?: number;
  rateId?: string;
}

/**
 * Shipment request parameters
 */
export interface ShipmentRequest {
  shipperAddress: ShippingAddress;
  recipientAddress: ShippingAddress;
  packages: PackageDetails[];
  serviceType?: ShippingServiceType;
  isResidential?: boolean;
  reference?: string;
  labelFormat?: string;
  rateId?: string;
  insuranceValue?: number;
}

/**
 * Shipment creation response
 */
export interface ShipmentResponse {
  trackingNumber: string;
  labelUrl: string;
  shipmentId?: string;
  totalAmount: number;
  currency: string;
  estimatedDeliveryDate?: Date;
}

/**
 * Tracking request parameters
 */
export interface TrackingRequest {
  trackingNumber: string;
}

/**
 * Tracking event details
 */
export interface TrackingEvent {
  timestamp: Date;
  status: TrackingStatus;
  location: string;
  description: string;
}

/**
 * Tracking response
 */
export interface TrackingResponse {
  trackingNumber: string;
  currentStatus: TrackingStatus;
  estimatedDeliveryDate?: Date;
  events: TrackingEvent[];
  providerName?: string;
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
}

export interface TrackingOrderInfo {
  id: string
  orderNumber: string
  orderDate: string // ISO date string
  status: string
  items: OrderItem[]
  customer?: {
    name: string | null
    email: string | null
  }
  shippingAddress: {
    addressLine1: string
    addressLine2: string | null
    city: string
    state: string
    postalCode: string
    country: string
  }
}

export interface TrackingFullResponse {
  trackingInfo: TrackingResponse
  order: TrackingOrderInfo | null
}

/**
 * Shipping provider interface
 * All shipping providers must implement this interface
 */
export interface ShippingProvider {
  /**
   * Get the provider name
   */
  getProviderName(): string;
  
  /**
   * Calculate shipping rates
   * @param request Rate request parameters
   * @returns Array of rate quotes
   */
  getRates(request: RateRequest): Promise<RateQuote[]>;
  
  /**
   * Create a shipment and generate a shipping label
   * @param request Shipment request parameters
   * @returns Shipment creation response
   */
  createShipment(request: ShipmentRequest): Promise<ShipmentResponse>;
  
  /**
   * Validate provider credentials to ensure they are correctly configured
   * @returns Promise that resolves to true if credentials are valid, false otherwise
   */
  validateCredentials?(): Promise<boolean>;
  
  /**
   * Track a shipment by tracking number
   * @param request Tracking request parameters
   * @returns Tracking response
   */
  trackShipment(request: TrackingRequest): Promise<TrackingResponse>;
  
  /**
   * Validate a shipping address
   * @param address Address to validate
   * @returns Validation result with suggested corrected address if available
   */
  validateAddress(address: Address): Promise<{
    valid: boolean;
    suggestedAddress?: Address;
    messages: string[];
  }>;
  
  /**
   * Test authentication with the shipping provider's API
   * @returns Authentication status
   */
  testAuthentication(): Promise<{
    authenticated: boolean;
    message: string;
  }>;
}