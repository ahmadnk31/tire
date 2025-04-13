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
 * DHL API credentials and configuration
 */
interface DHLConfig {
  apiKey: string;
  apiSecret: string;
  accountNumber: string;
  apiUrl: string;
}

/**
 * Maps our standard service types to DHL-specific service types
 */
const SERVICE_TYPE_MAP: Record<ShippingServiceType, string> = {
  [ShippingServiceType.STANDARD]: 'P',       // DHL Parcel
  [ShippingServiceType.EXPRESS]: 'N',        // DHL Express Worldwide
  [ShippingServiceType.PRIORITY]: 'D',       // DHL Express 9:00
  [ShippingServiceType.ECONOMY]: 'U'         // DHL Express Worldwide
};

/**
 * Maps DHL tracking status codes to our standardized tracking statuses
 */
const TRACKING_STATUS_MAP: Record<string, TrackingStatus> = {
  'pre-transit': TrackingStatus.CREATED,
  'transit': TrackingStatus.IN_TRANSIT,
  'delivered': TrackingStatus.DELIVERED,
  'failure': TrackingStatus.EXCEPTION,
  'shipment-information-received': TrackingStatus.CREATED,
  'pickup': TrackingStatus.PICKED_UP,
  'processed': TrackingStatus.IN_TRANSIT,
  'processed-at-delivery-facility': TrackingStatus.OUT_FOR_DELIVERY,
  'out-for-delivery': TrackingStatus.OUT_FOR_DELIVERY,
};

/**
 * DHL implementation of the ShippingProvider interface
 */
export class DHLShippingProvider implements ShippingProvider {
  private config: DHLConfig;
  private isBrowser: boolean;
  
  constructor() {
    // Initialize with environment variables or default test credentials
    this.config = {
      apiKey: process.env.DHL_API_KEY || '',
      apiSecret: process.env.DHL_API_SECRET || '',
      accountNumber: process.env.DHL_ACCOUNT_NUMBER || '',
      apiUrl: process.env.DHL_API_URL || 'https://api-mock.dhl.com/mydhl/v1'
    };
    
    // Detect if we're running in a browser environment
    this.isBrowser = typeof window !== 'undefined';
  }
  
  /**
   * Get the provider name
   * @returns The name of this shipping provider
   */
  getProviderName(): string {
    return 'DHL';
  }
  
  /**
   * Get authentication token for DHL API
   * @returns Authentication token
   */
  async getAuthToken() {
    // For DHL Express MyDHL API, we don't need to fetch a separate token
    // The API uses Basic Authentication directly on each request
    try {
      // Check if credentials are available
      if (!this.config.apiKey || !this.config.apiSecret) {
        console.warn('DHL credentials are missing or incomplete');
        return 'missing-credentials-placeholder';
      }
      
      // Create Basic Auth token to use directly with API requests
      const authString = Buffer.from(`${this.config.apiKey}:${this.config.apiSecret}`).toString('base64');
      // Set a long expiry since Basic Auth tokens don't expire
      const tokenExpiry = new Date();
      tokenExpiry.setFullYear(tokenExpiry.getFullYear() + 1);
      
      console.log('Using DHL Basic Authentication');
      
      return authString;
    } catch (error) {
      console.error('Error preparing DHL authentication:', error);
      throw new Error(`DHL authentication failed: ${(error as Error).message}`);
    }
  }
    /**
     * Format an address for DHL API
     */
  private formatAddress(address: ShippingAddress): any {
    return {
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      countryCode: address.countryCode,
      postalCode: address.postalCode,
      name: address.contactName,
      companyName: address.companyName || '',
      phone: address.phone,
      email: address.email
    };
  }

  /**
   * Convert our standard package details to DHL format
   */
  private formatPackages(packages: PackageDetails[]): any[] {
    return packages.map((pkg, index) => ({
      weight: {
        value: pkg.weight,
        unitOfMeasurement: 'kg'
      },
      dimensions: {
        length: pkg.length,
        width: pkg.width,
        height: pkg.height,
        unitOfMeasurement: 'cm'
      },
      customerReferences: [{
        value: pkg.description || 'Merchandise',
        typeCode: 'CU'
      }],
      number: index + 1
    }));
  }

  /**
   * Calculate shipping rates
   */
  async getRates(request: RateRequest): Promise<RateQuote[]> {
    try {
      const authToken = await this.getAuthToken();
        // Ensure country codes are in ISO 2-letter format
      const formatCountryCode = (code: string) => {
        // If already 2 letters, return as is
        if (code && code.length === 2) {
          return code;
        }
        
        // Map of full country names to ISO codes
        const countryMap: Record<string, string> = {
          'BELGIUM': 'BE',
          'belgium': 'BE',
          'GERMANY': 'DE',
          'FRANCE': 'FR',
          'NETHERLANDS': 'NL',
          'UNITED STATES': 'US',
          'USA': 'US',
          'UNITED KINGDOM': 'GB',
          'UK': 'GB'
        };
        
        return countryMap[code] || code;
      };
      
      const senderCountryCode = formatCountryCode(request.shipperAddress.countryCode);
      const receiverCountryCode = formatCountryCode(request.recipientAddress.countryCode);
      
      const payload = {
        plannedShippingDate: new Date().toISOString().split('T')[0],
        unitOfMeasurement: 'metric',
        isCustomsDeclarable: false,
        accounts: [{
          typeCode: "shipper",
          number: this.config.accountNumber
        }],
        senderAddress: {
          addressLine1: request.shipperAddress.addressLine1,
          addressLine2: request.shipperAddress.addressLine2 || '',
          city: request.shipperAddress.city,
          postalCode: request.shipperAddress.postalCode,
          countryCode: senderCountryCode
        },
        receiverAddress: {
          addressLine1: request.recipientAddress.addressLine1,
          addressLine2: request.recipientAddress.addressLine2 || '',
          city: request.recipientAddress.city,
          postalCode: request.recipientAddress.postalCode,
          countryCode: receiverCountryCode
        },
        packages: request.packages.map(pkg => ({
          weight: {
            value: pkg.weight,
            unitOfMeasurement: 'kg'
          },
          dimensions: {
            length: pkg.length,
            width: pkg.width,
            height: pkg.height,
            unitOfMeasurement: 'cm'
          }
        }))
      };      // Ensure correct API URL format with /mydhlapi/test or /mydhlapi path
      let ratesUrl = this.config.apiUrl;
      if (!ratesUrl.endsWith('/test') && !ratesUrl.includes('/mydhlapi/test')) {
        ratesUrl = `${ratesUrl}/mydhlapi/test/rates`;
      } else if (ratesUrl.endsWith('/test')) {
        ratesUrl = `${ratesUrl}/rates`;
      } else if (ratesUrl.endsWith('/mydhlapi/test')) {
        ratesUrl = `${ratesUrl}/rates`;
      } else {
        ratesUrl = `${ratesUrl}/rates`;
      }
        console.log('DHL rate request URL:', ratesUrl);
      console.log('Using auth token (first 10 chars):', authToken.substring(0, 10) + '...');
      console.log('Payload:', JSON.stringify(payload, null, 2));
        
      try {
        // Check DHL API documentation for proper request format
        // Sometimes the API expects a different structure than what we're sending
        const dhsRatesPayload = {
          customerDetails: {
            shipperDetails: {
              postalCode: request.shipperAddress.postalCode,
              cityName: request.shipperAddress.city,
              countryCode: senderCountryCode
            },
            receiverDetails: {
              postalCode: request.recipientAddress.postalCode,
              cityName: request.recipientAddress.city,
              countryCode: receiverCountryCode
            }
          },
          plannedShippingDate: new Date().toISOString().split('T')[0],
          unitOfMeasurement: "metric",
          packages: request.packages.map(pkg => ({
            weight: pkg.weight,
            dimensions: {
              length: pkg.length,
              width: pkg.width,
              height: pkg.height
            }
          }))
        };
          console.log('Using alternate payload format:', JSON.stringify(dhsRatesPayload, null, 2));
        const response = await axios.post(
          ratesUrl,
          dhsRatesPayload,
          {
            headers: {
              'Authorization': `Basic ${authToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        );
        
        return this.processRatesResponse(response.data);
      } catch (error: any) {
        // Capture and log the detailed error response
        if (error.response) {
          console.error('DHL API error details:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          });
        }
        console.error('Error getting DHL rates:', error);
        throw new Error('Failed to get shipping rates from DHL');
      }
    } catch (error) {
      console.error('Error in DHL authentication:', error);
      throw new Error('Failed to get shipping rates from DHL: Authentication error');
    }
  }
  
  /**
   * Process the rates response from DHL API
   * @param responseData The response data from DHL rates API
   * @returns Formatted rate quotes
   */
  private processRatesResponse(responseData: any): RateQuote[] {
    if (!responseData.products || responseData.products.length === 0) {
      return [];
    }

    // Map DHL rate response to our standardized format
    return responseData.products.map((product: any) => {
      // Find our service type from DHL's product code
      const serviceType = this.mapDHLProductToServiceType(product.productCode);

      // Calculate delivery date
      const deliveryDate = product.deliveryCapabilities?.estimatedDeliveryDate 
        ? new Date(product.deliveryCapabilities.estimatedDeliveryDate) 
        : undefined;

      return {
        providerName: this.getProviderName(),
        serviceType,
        deliveryDate,
        totalAmount: product.totalPrice[0].price,
        currency: product.totalPrice[0].currencyCode,
        transitDays: product.deliveryCapabilities?.estimatedDeliveryTimeInDays,
        rateId: product.productCode
      };
    });
  }

  /**
   * Map DHL product codes to our service types
   */
  private mapDHLProductToServiceType(productCode: string): ShippingServiceType {
    // Map common DHL product codes to our service types
    const codeMap: Record<string, ShippingServiceType> = {
      'N': ShippingServiceType.EXPRESS,     // EXPRESS WORLDWIDE
      'P': ShippingServiceType.STANDARD,    // PARCEL
      'D': ShippingServiceType.PRIORITY,    // EXPRESS 9:00
      'U': ShippingServiceType.ECONOMY      // EXPRESS WORLDWIDE (Economy)
    };

    return codeMap[productCode] || ShippingServiceType.STANDARD;
  }

  /**
   * Validate a shipping address with DHL
   * @param address Address to validate
   * @returns Validation result with suggested corrected address if available
   */
  async validateAddress(address: Address): Promise<{
    valid: boolean;
    suggestedAddress?: Address;
    messages: string[];
  }> {
    try {
      const authToken = await this.getAuthToken();
      
      // If running on client-side, we can't perform address validation
      if (this.isBrowser) {
        throw new Error('Address validation must be performed server-side');
      }

      // Format the address for validation
      const addressPayload = {
        addressLine1: address.street,
        addressLine2: address.addressLine2 || '',
        city: address.city,
        postalCode: address.postalCode,
        countryCode: address.countryCode,
      };      // Call DHL's address validation API
      const response = await axios.post(
        `${this.config.apiUrl}/address-validation`,
        { address: addressPayload },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Check if the address is valid
      const isValid = response.data.valid === true;
        // Prepare response data
      const result: {
        valid: boolean;
        suggestedAddress?: Address;
        messages: string[];
      } = {
        valid: isValid,
        messages: [] as string[],
      };

      // If there are suggestions, format them
      if (response.data.suggestedAddresses && response.data.suggestedAddresses.length > 0) {
        const suggestion = response.data.suggestedAddresses[0];
        result.suggestedAddress = {
          street: suggestion.addressLine1,
          addressLine2: suggestion.addressLine2,
          city: suggestion.city,
          postalCode: suggestion.postalCode,
          countryCode: suggestion.countryCode,
        };
        
        result.messages.push('Address was corrected based on DHL recommendations');
      }

      // Add any warning messages
      if (response.data.messages && response.data.messages.length > 0) {
        response.data.messages.forEach((msg: any) => {
          result.messages.push(msg.text || 'Address validation message');
        });
      }

      return result;
    } catch (error) {
      console.error('Error validating address with DHL:', error);
      return {
        valid: false,
        messages: [(error as Error).message]
      };
    }
  }

  /**
   * Test authentication with DHL API
   * @returns Authentication status
   */
  async testAuthentication(): Promise<{
    authenticated: boolean;
    message: string;
  }> {
    try {
      // If running on client-side, we can't perform authentication test
      if (this.isBrowser) {
        return {
          authenticated: false,
          message: 'Authentication testing must be performed server-side'
        };
      }

      // Try to get an auth token as a test
      const authToken = await this.getAuthToken();
      
      // If we get a placeholder token, credentials are missing
      if (authToken === 'missing-credentials-placeholder') {
        return {
          authenticated: false,
          message: 'DHL credentials are missing or incomplete. Check your environment variables.'
        };
      }
      
      // If we get here, authentication was successful
      return {
        authenticated: true,
        message: 'Successfully authenticated with DHL API'
      };
    } catch (error) {
      console.error('DHL authentication test failed:', error);
      return {
        authenticated: false,
        message: `Authentication failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Track a shipment by tracking number
   * @param request Tracking request parameters
   * @returns Tracking response
   */
  async trackShipment(request: TrackingRequest): Promise<TrackingResponse> {
    try {
      const authToken = await this.getAuthToken();
      
      // If running on client-side, we can't perform tracking
      if (this.isBrowser) {
        throw new Error('Tracking must be performed server-side');
      }      // Make the tracking request to DHL API
      const response = await axios.get(
        `${this.config.apiUrl}/tracking/${request.trackingNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Check if we have valid tracking data
      if (!response.data || !response.data.shipments || response.data.shipments.length === 0) {
        throw new Error('No tracking information found for this number');
      }

      const shipment = response.data.shipments[0];
      
      // Map DHL tracking status to our standardized status
      const currentDHLStatus = shipment.status || 'unknown';
      const currentStatus = TRACKING_STATUS_MAP[currentDHLStatus.toLowerCase()] || TrackingStatus.UNKNOWN;

      // Format the tracking events
      const events: TrackingEvent[] = (shipment.events || []).map((event: any) => {
        // Map the event status to our standardized status
        const eventStatus = event.status 
          ? (TRACKING_STATUS_MAP[event.status.toLowerCase()] || TrackingStatus.UNKNOWN)
          : TrackingStatus.UNKNOWN;
        
        return {
          timestamp: new Date(event.timestamp || Date.now()),
          status: eventStatus,
          location: event.location || 'Unknown Location',
          description: event.description || 'No description available'
        };
      });

      // Format the estimated delivery date if available
      const estimatedDeliveryDate = shipment.estimatedDeliveryDate
        ? new Date(shipment.estimatedDeliveryDate)
        : undefined;

      // Return the standardized tracking response
      return {
        trackingNumber: request.trackingNumber,
        currentStatus,
        estimatedDeliveryDate,
        events,
        providerName: this.getProviderName()
      };
    } catch (error) {
      console.error('Error tracking shipment with DHL:', error);
      
      // Return a default response for error cases
      return {
        trackingNumber: request.trackingNumber,
        currentStatus: TrackingStatus.UNKNOWN,
        events: [{
          timestamp: new Date(),
          status: TrackingStatus.UNKNOWN,
          location: 'Unknown',
          description: `Error tracking shipment: ${(error as Error).message}`
        }],
        providerName: this.getProviderName()
      };
    }
  }

  /**
   * Create a shipment and generate a shipping label
   * @param request Shipment request parameters
   * @returns Shipment creation response with tracking number and label URL
   */
  async createShipment(request: ShipmentRequest): Promise<ShipmentResponse> {
    try {
      const authToken = await this.getAuthToken();
      
      // If running on client-side, we can't create shipments
      if (this.isBrowser) {
        throw new Error('Shipment creation must be performed server-side');
      }

      // Map our service type to DHL service type
      const serviceType = request.serviceType 
        ? SERVICE_TYPE_MAP[request.serviceType] 
        : 'P';  // Default to Parcel      // Format the shipment request for DHL API
      const payload: any = {
        plannedShippingDate: new Date().toISOString().split('T')[0],
        productCode: serviceType,
        accounts: [{
          typeCode: 'shipper',
          number: this.config.accountNumber
        }],
        customerReferences: [{
          value: request.reference || 'Online Order',
          typeCode: 'CU'
        }],
        shipperDetails: {
          address: {
            addressLine1: request.shipperAddress.addressLine1,
            addressLine2: request.shipperAddress.addressLine2 || '',
            city: request.shipperAddress.city,
            postalCode: request.shipperAddress.postalCode,
            countryCode: request.shipperAddress.countryCode,
          },
          contactInformation: {
            phone: request.shipperAddress.phone,
            companyName: request.shipperAddress.companyName || '',
            fullName: request.shipperAddress.contactName,
            email: request.shipperAddress.email
          }
        },
        receiverDetails: {
          address: {
            addressLine1: request.recipientAddress.addressLine1,
            addressLine2: request.recipientAddress.addressLine2 || '',
            city: request.recipientAddress.city,
            postalCode: request.recipientAddress.postalCode,
            countryCode: request.recipientAddress.countryCode,
          },
          contactInformation: {
            phone: request.recipientAddress.phone,
            companyName: request.recipientAddress.companyName || '',
            fullName: request.recipientAddress.contactName,
            email: request.recipientAddress.email
          }
        },
        packages: this.formatPackages(request.packages),
        outputImageProperties: {
          printerDPI: 300,
          encodingFormat: request.labelFormat || 'pdf',
          imageOptions: [
            {
              typeCode: 'label',
              templateName: 'ECOM26_84_001'
            }
          ]
        }
      };

      // Add insurance if specified
      if (request.insuranceValue && request.insuranceValue > 0) {
        payload.valueAddedServices = [
          {
            serviceCode: 'II', // Insurance
            value: request.insuranceValue,
            currency: 'USD' // Use appropriate currency code
          }
        ];
      }      // Create the shipment
      const response = await axios.post(
        `${this.config.apiUrl}/shipments`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Extract shipment details from the response
      const shipmentData = response.data;
      
      if (!shipmentData.packages || shipmentData.packages.length === 0) {
        throw new Error('No package information in DHL response');
      }

      // Get the tracking number from the first package
      const trackingNumber = shipmentData.packages[0].trackingNumber;
      
      // Get the label URL
      const labelUrl = shipmentData.documents && shipmentData.documents.length > 0
        ? shipmentData.documents[0].url
        : '';
      
      // Get the estimated delivery date if available
      const estimatedDeliveryDate = shipmentData.estimatedDeliveryDate
        ? new Date(shipmentData.estimatedDeliveryDate)
        : undefined;

      // Return the shipment response
      return {
        trackingNumber,
        labelUrl,
        shipmentId: shipmentData.id || trackingNumber,
        totalAmount: shipmentData.totalPrice?.price || 0,
        currency: shipmentData.totalPrice?.currencyCode || 'USD',
        estimatedDeliveryDate
      };
    } catch (error) {
      console.error('Error creating shipment with DHL:', error);
      throw new Error(`Failed to create shipment: ${(error as Error).message}`);
    }
  }

  /**
   * Manually create a shipment record when automatic creation fails
   * This provides a fallback for when the DHL API fails to create a shipment
   * 
   * @param request Shipment request parameters
   * @param manualTrackingNumber Optional manually assigned tracking number
   * @returns Shipment creation response with manually entered data
   */
  async createManualShipment(request: ShipmentRequest, manualTrackingNumber?: string): Promise<ShipmentResponse> {
    try {
      // Generate a "manual" tracking number if none provided
      const trackingNumber = manualTrackingNumber || `MANUAL-DHL-${Date.now().toString().slice(-8)}`;
      
      // Calculate a future date for estimated delivery (5 business days from now)
      const estimatedDeliveryDate = new Date();
      estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 5);
      
      // Calculate shipping cost based on weight and dimensions
      // This is a simple calculation - real costs would come from the provider
      let totalWeight = 0;
      request.packages.forEach(pkg => {
        totalWeight += pkg.weight;
      });
      
      // Basic rate calculation (replace with your own logic if needed)
      const baseRate = 10; // Starting rate
      const weightRate = totalWeight * 2; // $2 per kg
      const totalAmount = baseRate + weightRate;
      
      console.log(`Creating manual shipment with tracking number: ${trackingNumber}`);
      
      // Return a manually created shipment response
      return {
        trackingNumber,
        labelUrl: '', // No label URL for manual shipments
        shipmentId: trackingNumber,
        totalAmount,
        currency: 'USD', // Default currency
        estimatedDeliveryDate,
      };
    } catch (error) {
      console.error('Error creating manual shipment:', error);
      throw new Error(`Failed to create manual shipment: ${(error as Error).message}`);
    }
  }

  /**
   * Create a shipment with fallback to manual creation if automatic fails
   * @param request Shipment request parameters
   * @param manualTrackingNumber Optional manually assigned tracking number (for manual creation)
   * @returns Shipment creation response
   */
  async createShipmentWithFallback(request: ShipmentRequest, manualTrackingNumber?: string): Promise<ShipmentResponse> {
    try {
      // Attempt automatic shipment creation first
      return await this.createShipment(request);
    } catch (error) {
      console.warn(`Automatic shipment creation failed: ${(error as Error).message}. Falling back to manual creation.`);
      
      // Fall back to manual shipment creation
      return this.createManualShipment(request, manualTrackingNumber);
    }
  }
}