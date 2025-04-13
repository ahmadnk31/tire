import {
  ShippingProvider,
  RateRequest,
  RateQuote,
  ShipmentRequest,
  ShipmentResponse,
  TrackingRequest,
  TrackingResponse,
  ShippingAddress,
  ShippingServiceType,
  TrackingStatus,
  Address
} from '../shipping-interfaces';

/**
 * FedEx shipping provider implementation
 */
export class FedExProvider implements ShippingProvider {
  private config: any;
  
  constructor() {
    // Initialize with environment variables or default test credentials
    this.config = {
      apiKey: process.env.FEDEX_API_KEY || '',
      apiSecret: process.env.FEDEX_API_SECRET || '',
      accountNumber: process.env.FEDEX_ACCOUNT_NUMBER || '',
      apiUrl: process.env.FEDEX_API_URL || 'https://api-test.fedex.com/v1'
    };
  }
  
  /**
   * Get the provider name
   * @returns The name of this shipping provider
   */
  getProviderName(): string {
    return 'FedEx';
  }

  /**
   * Get access token for FedEx API
   * @returns Access token
   */
  private async getAccessToken(): Promise<string> {
    try {
      // Skip API call if credentials are missing
      if (!this.config.apiKey || !this.config.apiSecret || !this.config.accountNumber) {
        throw new Error('FedEx credentials are missing or incomplete');
      }

      const response = await fetch(`${this.config.apiUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.config.apiKey,
          client_secret: this.config.apiSecret
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Notify the factory that this provider isn't working
        const { ShippingProviderFactory } = require('../shipping-provider-factory');
        ShippingProviderFactory.markProviderAsNotWorking('FedEx');
        throw new Error(`Failed to get FedEx access token: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      // Mark provider as not working when authentication fails
      const { ShippingProviderFactory } = require('../shipping-provider-factory');
      ShippingProviderFactory.markProviderAsNotWorking('FedEx');
      console.error('Error getting FedEx access token:', error);
      throw error;
    }
  }

  /**
   * Map internal service type to FedEx service type
   * @param serviceType Internal service type
   * @returns FedEx service type
   */
  private mapServiceType(serviceType?: ShippingServiceType): string {
    switch (serviceType) {
      case ShippingServiceType.STANDARD:
        return 'FEDEX_GROUND';
      case ShippingServiceType.EXPRESS:
        return 'FEDEX_2_DAY';
      case ShippingServiceType.PRIORITY:
        return 'PRIORITY_OVERNIGHT';
      case ShippingServiceType.ECONOMY:
        return 'FEDEX_EXPRESS_SAVER';
      default:
        return 'FEDEX_GROUND';
    }
  }

  /**
   * Map FedEx service type to internal service type
   * @param fedexServiceType FedEx service type
   * @returns Internal service type
   */
  private mapFedExServiceType(fedexServiceType: string): ShippingServiceType {
    switch (fedexServiceType) {
      case 'FEDEX_GROUND':
        return ShippingServiceType.STANDARD;
      case 'FEDEX_2_DAY':
      case 'FEDEX_2_DAY_AM':
        return ShippingServiceType.EXPRESS;
      case 'PRIORITY_OVERNIGHT':
      case 'STANDARD_OVERNIGHT':
        return ShippingServiceType.PRIORITY;
      case 'FEDEX_EXPRESS_SAVER':
        return ShippingServiceType.ECONOMY;
      default:
        return ShippingServiceType.STANDARD;
    }
  }

  /**
   * Map FedEx tracking status to internal tracking status
   * @param fedexStatus FedEx tracking status
   * @returns Internal tracking status
   */
  private mapTrackingStatus(fedexStatus: string): TrackingStatus {
    switch (fedexStatus) {
      case 'AA':
      case 'AC':
      case 'AD':
        return TrackingStatus.CREATED;
      case 'PU':
        return TrackingStatus.PICKED_UP;
      case 'IT':
      case 'AR':
      case 'DP':
        return TrackingStatus.IN_TRANSIT;
      case 'OD':
        return TrackingStatus.OUT_FOR_DELIVERY;
      case 'DL':
        return TrackingStatus.DELIVERED;
      case 'DE':
      case 'CA':
        return TrackingStatus.EXCEPTION;
      default:
        return TrackingStatus.UNKNOWN;
    }
  }

  /**
   * Format address for FedEx API
   * @param address Shipping address
   * @returns FedEx formatted address
   */
  private formatAddress(address: ShippingAddress): any {
    return {
      personName: address.contactName,
      companyName: address.companyName || '',
      phoneNumber: address.phone,
      emailAddress: address.email,
      address: {
        streetLines: [
          address.addressLine1,
          address.addressLine2 || ''
        ].filter(Boolean),
        city: address.city,
        stateOrProvinceCode: address.state,
        postalCode: address.postalCode,
        countryCode: address.countryCode,
        residential: true
      }
    };
  }

  /**
   * Convert package details to FedEx format
   * @param packages Array of package details
   * @returns Array of packages in FedEx format
   */
  private formatPackages(packages: any[]): any[] {
    return packages.map((pkg, index) => ({
      sequenceNumber: String(index + 1),
      groupPackageCount: 1,
      weight: {
        units: 'KG',
        value: pkg.weight
      },
      dimensions: {
        length: pkg.length,
        width: pkg.width,
        height: pkg.height,
        units: 'CM'
      },
      contentRecord: pkg.description ? [{
        description: pkg.description
      }] : []
    }));
  }

  /**
   * Calculate shipping rates
   * @param request Rate request parameters
   * @returns Array of rate quotes
   */
  async getRates(request: RateRequest): Promise<RateQuote[]> {
    try {
      const accessToken = await this.getAccessToken();
      
      // Prepare the request payload for FedEx Rate API
      const payload = {
        accountNumber: {
          value: this.config.accountNumber
        },
        requestedShipment: {
          shipper: this.formatAddress(request.shipperAddress),
          recipient: this.formatAddress(request.recipientAddress),
          pickupType: 'REGULAR_PICKUP',
          serviceType: request.serviceType ? this.mapServiceType(request.serviceType) : undefined,
          rateRequestType: ['LIST', 'ACCOUNT'],
          preferredCurrency: 'USD',
          packages: this.formatPackages(request.packages)
        }
      };

      // Make the API call to FedEx Rate API
      const response = await fetch(`${this.config.apiUrl}/rate/v1/rates/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get FedEx rates: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      // Process the response and map to our rate quote format
      if (!data.output || !data.output.rateReplyDetails) {
        return [];
      }

      // Extract rate quotes from the response
      return data.output.rateReplyDetails.map((rate: any) => {
        const serviceType = this.mapFedExServiceType(rate.serviceType);
        const currency = rate.ratedShipmentDetails[0].totalNetCharge.currency;
        const totalAmount = Number(rate.ratedShipmentDetails[0].totalNetCharge.amount);
        const deliveryDate = rate.deliveryTimestamp ? new Date(rate.deliveryTimestamp) : undefined;
        const transitDays = rate.transitTime ? this.parseTransitDays(rate.transitTime) : undefined;
        
        return {
          providerName: this.getProviderName(),
          serviceType,
          deliveryDate,
          totalAmount,
          currency,
          transitDays,
          rateId: rate.rateId || rate.serviceType
        };
      });
    } catch (error) {
      console.error('Error getting FedEx rates:', error);
      throw error;
    }
  }

  /**
   * Parse transit days from FedEx transit time string
   * @param transitTime FedEx transit time string
   * @returns Number of days
   */
  private parseTransitDays(transitTime: string): number | undefined {
    const transitDaysMap: { [key: string]: number } = {
      'ONE_DAY': 1,
      'TWO_DAYS': 2,
      'THREE_DAYS': 3,
      'FOUR_DAYS': 4,
      'FIVE_DAYS': 5,
      'SIX_DAYS': 6,
      'SEVEN_DAYS': 7
    };
    
    return transitDaysMap[transitTime];
  }

  /**
   * Create a shipment and generate a shipping label
   * @param request Shipment request parameters
   * @returns Shipment creation response
   */
  async createShipment(request: ShipmentRequest): Promise<ShipmentResponse> {
    try {
      const accessToken = await this.getAccessToken();
      
      // Prepare the request payload for FedEx Ship API
      const serviceType = this.mapServiceType(request.serviceType);
      
      const payload = {
        labelResponseOptions: 'URL_ONLY',
        requestedShipment: {
          shipper: this.formatAddress(request.shipperAddress),
          recipients: [this.formatAddress(request.recipientAddress)],
          shipDatestamp: new Date().toISOString().split('T')[0],
          serviceType,
          packagingType: 'YOUR_PACKAGING',
          pickupType: 'REGULAR_PICKUP',
          requestedPackageLineItems: this.formatPackages(request.packages),
          shippingChargesPayment: {
            paymentType: 'SENDER',
            payor: {
              responsibleParty: {
                accountNumber: {
                  value: this.config.accountNumber
                }
              }
            }
          },
          labelSpecification: {
            labelFormatType: request.labelFormat || 'PDF',
            imageType: 'PDF',
            labelStockType: 'PAPER_8.5X11_TOP_HALF_LABEL'
          },
          customerReferences: request.reference ? [
            {
              customerReferenceType: 'CUSTOMER_REFERENCE',
              value: request.reference
            }
          ] : []
        }
      };

      // Make the API call to FedEx Ship API
      const response = await fetch(`${this.config.apiUrl}/ship/v1/shipments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create FedEx shipment: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      // Extract shipment details from the response
      const completedShipment = data.output.completedShipmentDetail;
      const trackingNumber = completedShipment.masterTrackingNumber;
      const labelUrl = completedShipment.shipmentDocuments[0].url;
      const shipmentId = completedShipment.shipmentId;
      const totalAmount = Number(completedShipment.shipmentRating.shipmentRateDetails[0].totalNetCharge.amount);
      const currency = completedShipment.shipmentRating.shipmentRateDetails[0].totalNetCharge.currency;
      const estimatedDeliveryDate = completedShipment.operationalDetail.deliveryDate
        ? new Date(completedShipment.operationalDetail.deliveryDate)
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
      console.error('Error creating FedEx shipment:', error);
      throw error;
    }
  }

  /**
   * Track a shipment by tracking number
   * @param request Tracking request parameters
   * @returns Tracking response
   */
  async trackShipment(request: TrackingRequest): Promise<TrackingResponse> {
    try {
      const accessToken = await this.getAccessToken();
      
      // Prepare the request payload for FedEx Track API
      const payload = {
        includeDetailedScans: true,
        trackingInfo: [
          {
            trackingNumberInfo: {
              trackingNumber: request.trackingNumber
            }
          }
        ]
      };

      // Make the API call to FedEx Track API
      const response = await fetch(`${this.config.apiUrl}/track/v1/trackingnumbers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to track FedEx shipment: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      // Extract tracking details from the response
      const trackResult = data.output.completeTrackResults[0].trackResults[0];
      
      if (!trackResult) {
        throw new Error(`No tracking information found for tracking number: ${request.trackingNumber}`);
      }
      
      const currentStatus = this.mapTrackingStatus(trackResult.latestStatusDetail.code);
      const estimatedDeliveryDate = trackResult.estimatedDeliveryTimestamp
        ? new Date(trackResult.estimatedDeliveryTimestamp)
        : undefined;
      
      // Map scan events to tracking events
      const events = (trackResult.scanEvents || []).map((scan: any) => ({
        timestamp: new Date(scan.date + 'T' + scan.time),
        status: this.mapTrackingStatus(scan.eventType),
        location: scan.scanLocation ? `${scan.scanLocation.city}, ${scan.scanLocation.stateOrProvinceCode}, ${scan.scanLocation.countryCode}` : 'Unknown',
        description: scan.eventDescription
      }));
      
      return {
        trackingNumber: request.trackingNumber,
        currentStatus,
        estimatedDeliveryDate,
        events
      };
    } catch (error) {
      console.error('Error tracking FedEx shipment:', error);
      throw error;
    }
  }
  /**
   * Validate a shipping address
   * @param address Address to validate
   * @returns Validation result with valid flag, messages, and optional suggested address
   */
  async validateAddress(address: Address): Promise<{
    valid: boolean;
    suggestedAddress?: Address;
    messages: string[];
  }> {
    try {
      const accessToken = await this.getAccessToken();
      
      // Prepare the request payload for FedEx Address Validation API
      const payload = {
        addressesToValidate: [
          {
            address: {
              streetLines: [
                address.street,
                address.addressLine2 || ''
              ].filter(Boolean),
              city: address.city,
              stateOrProvinceCode: address.state || '',
              postalCode: address.postalCode,
              countryCode: address.countryCode,
              residential: true
            }
          }
        ]
      };

      // Make the API call to FedEx Address Validation API
      const response = await fetch(`${this.config.apiUrl}/address/v1/addresses/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          valid: false,
          messages: [`Failed to validate address with FedEx: ${response.status} ${errorText}`]
        };
      }

      const data = await response.json();
      
      // Extract validation result
      const result = data.output.resolvedAddresses[0];
      
      // Check if address is valid
      const valid = result.attributes.some((attr: any) => attr.name === 'DPV_CONFIRMATION_CODE' && ['Y', 'S', 'D'].includes(attr.value));
      
      // Collect messages
      const messages: string[] = result.customerMessages.map((msg: any) => msg.message);
      
      // Get suggested address if available
      const suggestedAddress = result.customerMessages.some((msg: any) => msg.code === 'STANDARDIZATION.APPLIED')
        ? {
            street: result.resolvedAddress.streetLines[0],
            addressLine2: result.resolvedAddress.streetLines[1] || undefined,
            city: result.resolvedAddress.city,
            state: result.resolvedAddress.stateOrProvinceCode || undefined,
            postalCode: result.resolvedAddress.postalCode,
            countryCode: result.resolvedAddress.countryCode
          }
        : undefined;
      
      return {
        valid,
        suggestedAddress,
        messages
      };
    } catch (error) {
      console.error('Error validating address with FedEx:', error);
      return {
        valid: false,
        messages: [`Error validating address: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Test authentication with FedEx API
   * @returns Authentication status
   */
  async testAuthentication(): Promise<{ authenticated: boolean; message: string }> {
    try {
      // Try to get an access token as a test of authentication
      await this.getAccessToken();
      
      // If we get here, authentication was successful
      return {
        authenticated: true,
        message: 'Successfully authenticated with FedEx API'
      };
    } catch (error) {
      console.error('Error testing FedEx authentication:', error);
      
      // Check if credentials are missing
      if (!this.config.apiKey || !this.config.apiSecret || !this.config.accountNumber) {
        return {
          authenticated: false,
          message: 'FedEx credentials are missing or incomplete. Check your environment variables.'
        };
      }
      
      return {
        authenticated: false,
        message: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}