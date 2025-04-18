import axios from 'axios';
import {
  ShippingProvider,
  ShippingAddress,
  PackageDetails,
  RateRequest,
  RateQuote,
  ShipmentRequest,
  ShipmentResponse,
  TrackingRequest,
  TrackingResponse,
  TrackingStatus,
  TrackingEvent,
  ShippingServiceType,
  Address
} from '../shipping-interfaces';

/**
 * GLS API credentials and configuration
 */
interface GLSConfig {
  apiKey: string;
  apiSecret: string;
  customerId: string;
  apiUrl: string;
}

/**
 * Maps our standard service types to GLS-specific service types
 */
const SERVICE_TYPE_MAP: Record<ShippingServiceType, string> = {
  [ShippingServiceType.STANDARD]: 'PARCEL',
  [ShippingServiceType.EXPRESS]: 'EXPRESS',
  [ShippingServiceType.PRIORITY]: 'EXPRESS_1200',
  [ShippingServiceType.ECONOMY]: 'ECONOMY'
};

/**
 * Maps GLS tracking status codes to our standardized tracking statuses
 */
const TRACKING_STATUS_MAP: Record<string, TrackingStatus> = {
  'PRE_ANNOUNCED': TrackingStatus.CREATED,
  'IN_DEPOT': TrackingStatus.IN_TRANSIT,
  'IN_TRANSIT': TrackingStatus.IN_TRANSIT,
  'DELIVERED': TrackingStatus.DELIVERED,
  'DELIVERY_FAILED': TrackingStatus.EXCEPTION,
  'PICKEDUP': TrackingStatus.PICKED_UP,
  'OUT_FOR_DELIVERY': TrackingStatus.OUT_FOR_DELIVERY,
};

/**
 * GLS implementation of the ShippingProvider interface
 */
export class GLSShippingProvider implements ShippingProvider {
  private config: any;
  
  constructor() {
    // Initialize with environment variables or default test credentials
    this.config = {
      apiKey: process.env.GLS_API_KEY || '',
      apiSecret: process.env.GLS_API_SECRET || '',
      accountNumber: process.env.GLS_ACCOUNT_NUMBER || '',
      apiUrl: process.env.GLS_API_URL || 'https://api-test.gls.com/v1'
    };
  }
  
  /**
   * Get the provider name
   * @returns The name of this shipping provider
   */
  getProviderName(): string {
    return 'GLS';
  }

  /**
   * Format an address for GLS API
   */
  private formatAddress(address: ShippingAddress): any {
    return {
      name1: address.contactName,
      name2: address.companyName || '',
      street1: address.addressLine1,
      street2: address.addressLine2 || '',
      city: address.city,
      zipCode: address.postalCode,
      countryCode: address.countryCode,
      province: address.state,
      contact: address.contactName,
      phone: address.phone,
      email: address.email
    };
  }

  /**
   * Convert our standard package details to GLS format
   */
  private formatPackages(packages: PackageDetails[]): any[] {
    return packages.map(pkg => ({
      weight: pkg.weight,
      length: pkg.length,
      width: pkg.width,
      height: pkg.height,
      content: pkg.description || 'Merchandise'
    }));
  }

  /**
   * Calculate shipping rates
   */
  async getRates(request: RateRequest): Promise<RateQuote[]> {
    try {
      // GLS requires authentication with each request
      const authHeaders = {
        'Authorization': `Basic ${Buffer.from(`${this.config.apiKey}:${this.config.apiSecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      };

      const payload = {
        customerId: this.config.customerId,
        sender: this.formatAddress(request.shipperAddress),
        recipient: this.formatAddress(request.recipientAddress),
        parcels: this.formatPackages(request.packages),
        shipmentDate: new Date().toISOString().split('T')[0],
        isResidential: request.isResidential || false,
        serviceType: request.serviceType ? SERVICE_TYPE_MAP[request.serviceType] : undefined
      };

      const response = await axios.post(
        `${this.config.apiUrl}/shipping/rates`,
        payload,
        { headers: authHeaders }
      );

      if (!response.data.rates || response.data.rates.length === 0) {
        return [];
      }

      // Map GLS rate response to our standardized format
      return response.data.rates.map((rate: any) => {
        // Map GLS service type to our service type
        const serviceType = this.mapGLSServiceTypeToOurs(rate.serviceType);

        return {
          providerName: this.getProviderName(),
          serviceType,
          deliveryDate: rate.estimatedDeliveryDate ? new Date(rate.estimatedDeliveryDate) : undefined,
          totalAmount: rate.totalPrice.amount,
          currency: rate.totalPrice.currency,
          transitDays: rate.transitDays,
          rateId: rate.rateId
        };
      });
    } catch (error) {
      console.error('Error getting GLS rates:', error);
      throw new Error('Failed to get shipping rates from GLS');
    }
  }

  /**
   * Map GLS service types to our standardized types
   */
  private mapGLSServiceTypeToOurs(glsServiceType: string): ShippingServiceType {
    const mapping: Record<string, ShippingServiceType> = {
      'PARCEL': ShippingServiceType.STANDARD,
      'EXPRESS': ShippingServiceType.EXPRESS,
      'EXPRESS_1200': ShippingServiceType.PRIORITY,
      'ECONOMY': ShippingServiceType.ECONOMY,
      // Add more mappings as needed
    };

    return mapping[glsServiceType] || ShippingServiceType.STANDARD;
  }

  /**
   * Create a shipment and generate a shipping label
   */
  async createShipment(request: ShipmentRequest): Promise<ShipmentResponse> {
    try {
      // GLS requires authentication with each request
      const authHeaders = {
        'Authorization': `Basic ${Buffer.from(`${this.config.apiKey}:${this.config.apiSecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      };

      const serviceType = request.serviceType 
        ? SERVICE_TYPE_MAP[request.serviceType] 
        : 'PARCEL';

      const payload = {
        customerId: this.config.customerId,
        sender: this.formatAddress(request.shipperAddress),
        recipient: this.formatAddress(request.recipientAddress),
        parcels: this.formatPackages(request.packages),
        shipmentDate: new Date().toISOString().split('T')[0],
        serviceType,
        reference: request.reference,
        labelFormat: request.labelFormat || 'PDF',
        rateId: request.rateId,
        isResidential: request.isResidential || false
      };

      const response = await axios.post(
        `${this.config.apiUrl}/shipping/shipments`,
        payload,
        { headers: authHeaders }
      );

      const shipment = response.data;
      
      // Extract tracking number
      const trackingNumber = shipment.trackingId;
      const shipmentId = shipment.shipmentId;
      
      // Get the label URL (base64 encoded)
      const labelUrl = shipment.labelData 
        ? `data:application/pdf;base64,${shipment.labelData}` 
        : '';
      
      // Get the total cost
      const totalAmount = shipment.totalPrice.amount;
      const currency = shipment.totalPrice.currency;
      
      // Get estimated delivery date
      const estimatedDeliveryDate = shipment.estimatedDeliveryDate
        ? new Date(shipment.estimatedDeliveryDate)
        : undefined;

      return {
        trackingNumber,
        labelUrl,
        shipmentId,
        totalAmount,
        currency,
        estimatedDeliveryDate
      };
    } catch (error) {
      console.error('Error creating GLS shipment:', error);
      throw new Error('Failed to create shipment with GLS');
    }
  }

  /**
   * Track a shipment by tracking number
   */
  async trackShipment(request: TrackingRequest): Promise<TrackingResponse> {
    try {
      // GLS requires authentication with each request
      const authHeaders = {
        'Authorization': `Basic ${Buffer.from(`${this.config.apiKey}:${this.config.apiSecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.get(
        `${this.config.apiUrl}/tracking/${request.trackingNumber}`,
        { headers: authHeaders }
      );

      const trackingInfo = response.data;
      
      // Map GLS status to our standardized status
      const currentStatus = TRACKING_STATUS_MAP[trackingInfo.status] || TrackingStatus.UNKNOWN;
      
      // Parse estimated delivery date if available
      const estimatedDeliveryDate = trackingInfo.estimatedDelivery
        ? new Date(trackingInfo.estimatedDelivery)
        : undefined;
      
      // Map tracking events
      const events: TrackingEvent[] = trackingInfo.events.map((event: any) => ({
        timestamp: new Date(event.timestamp),
        status: TRACKING_STATUS_MAP[event.status] || TrackingStatus.UNKNOWN,
        location: event.location,
        description: event.description
      }));

      return {
        trackingNumber: request.trackingNumber,
        currentStatus,
        estimatedDeliveryDate,
        events
      };
    } catch (error) {
      console.error('Error tracking GLS shipment:', error);
      throw new Error('Failed to track shipment with GLS');
    }
  }

  /**
   * Validate a shipping address
   * @param address Address to validate
   * @returns Validation result with valid flag, suggested address, and messages
   */
  async validateAddress(address: Address): Promise<{
    valid: boolean;
    suggestedAddress?: Address;
    messages: string[];
  }> {
    try {
      // GLS requires authentication with each request
      const authHeaders = {
        'Authorization': `Basic ${Buffer.from(`${this.config.apiKey}:${this.config.apiSecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      };

      const payload = {
        address: {
          street1: address.street,
          street2: address.addressLine2 || '',
          city: address.city,
          province: address.state || '',
          zipCode: address.postalCode,
          countryCode: address.countryCode
        }
      };

      const response = await axios.post(
        `${this.config.apiUrl}/address-validation`,
        payload,
        { headers: authHeaders }
      );

      const result = response.data;
      const messages: string[] = [];
      
      // Check if address is valid
      const valid = result.valid === true;
      
      if (valid) {
        messages.push('Address is valid');
      } else {
        messages.push('Address validation failed');
      }
      
      // Add any additional messages from the API response
      if (result.messages && Array.isArray(result.messages)) {
        result.messages.forEach((msg: any) => {
          messages.push(msg.text || msg.message || 'Address validation message');
        });
      }
      
      // If address is not valid but a suggested address is provided
      let suggestedAddress: Address | undefined = undefined;
      if (!valid && result.suggestions && result.suggestions.length > 0) {
        const suggested = result.suggestions[0];
        
        suggestedAddress = {
          street: suggested.street1,
          addressLine2: suggested.street2 || undefined,
          city: suggested.city,
          state: suggested.province,
          postalCode: suggested.zipCode,
          countryCode: suggested.countryCode
        };
        
        messages.push('Address suggestions available');
      }
      
      return { valid, suggestedAddress, messages };
    } catch (error) {
      console.error('Error validating address with GLS:', error);
      return {
        valid: false,
        messages: [`Failed to validate address with GLS: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Test authentication with GLS API
   * @returns Authentication status
   */
  async testAuthentication(): Promise<{ authenticated: boolean; message: string }> {
    try {
      // GLS requires authentication with each request
      const authHeaders = {
        'Authorization': `Basic ${Buffer.from(`${this.config.apiKey}:${this.config.apiSecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      };

      // Try a simple API call to verify authentication
      const response = await axios.get(
        `${this.config.apiUrl}/account/info`,
        { headers: authHeaders }
      );

      // If we get here, authentication was successful
      return {
        authenticated: true,
        message: 'Successfully authenticated with GLS API'
      };
    } catch (error) {
      console.error('Error testing GLS authentication:', error);
      
      // Check for specific error types
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          return {
            authenticated: false,
            message: 'Authentication failed: Invalid API credentials'
          };
        }
      }
      
      return {
        authenticated: false,
        message: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}