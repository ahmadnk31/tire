import { ShippingProviderFactory } from './shipping-provider-factory';
import { 
  ShippingProvider,
  RateRequest,
  RateQuote,
  ShipmentRequest,
  ShipmentResponse,
  TrackingResponse,
  ShippingAddress
} from './shipping-interfaces';
import { ShippingRateCache } from './shipping-cache';
import { logApiError } from '../utils/api-error-handler';

/**
 * Main shipping service that handles interactions with all shipping providers
 */
export class ShippingService {
  /**
   * Get shipping rates from all providers or a specific provider
   * @param request Rate request parameters
   * @param providerName Optional provider name, if not specified will get rates from all providers
   * @param useCache Whether to use and update the cache (default true)
   * @returns Array of rate quotes from all providers or the specified provider
   */
  static async getRates(
    request: RateRequest, 
    providerName?: string, 
    useCache: boolean = true
  ): Promise<RateQuote[]> {
    try {
      // Check cache first if enabled
      if (useCache) {
        const cachedRates = ShippingRateCache.getCachedRates(request);
        if (cachedRates) {
          // If provider is specified, filter the cached rates
          if (providerName) {
            return cachedRates.filter(
              rate => rate.providerName.toLowerCase() === providerName.toLowerCase()
            );
          }
          return cachedRates;
        }
      }
      
      // No cache hit, fetch from providers
      let rates: RateQuote[];
      
      if (providerName) {
        // Get rates from a specific provider
        const provider = await ShippingProviderFactory.getProvider(providerName);
        rates = await provider.getRates(request);
      } else {
        // Get rates from all providers in parallel
        const providers = await ShippingProviderFactory.getAllProviders();
        const ratePromises = providers.map(provider => 
          provider.getRates(request)
            .catch(error => {
              logApiError(`${provider.getProviderName()}.getRates`, error);
              return [] as RateQuote[]; // Return empty array on error
            })
        );
        
        const results = await Promise.all(ratePromises);
        rates = results.flat(); // Combine all rate quotes into a single array
      }
      
      // Update cache if enabled and we got results
      if (useCache && rates.length > 0) {
        ShippingRateCache.cacheRates(request, rates);
      }
      
      return rates;
    } catch (error) {
      logApiError('ShippingService.getRates', error);
      throw error;
    }
  }

  /**
   * Create a shipment with the specified provider
   * @param options Shipment creation options
   * @returns Shipment creation response
   */
  static async createShipment(options: {
    provider: string;
    serviceLevel: string;
    toAddress: ShippingAddress;
    fromAddress: any; 
    items: Array<{
      id: string;
      weight: number;
      dimensions: {
        length: number;
        width: number;
        height: number;
      };
      quantity: number;
    }>;
  }): Promise<ShipmentResponse> {
    try {
      // Get the specified provider
      const provider = await ShippingProviderFactory.getProvider(options.provider);
      
      // Format the request for the shipment
      const request: ShipmentRequest = {
        shipperAddress: {
          contactName: options.fromAddress.company || 'Shipping Department',
          companyName: options.fromAddress.company,
          phone: options.fromAddress.phone || '555-555-5555',
          email: options.fromAddress.email || 'shipping@example.com',
          addressLine1: options.fromAddress.street,
          addressLine2: options.fromAddress.addressLine2 || '',
          city: options.fromAddress.city,
          state: options.fromAddress.state,
          postalCode: options.fromAddress.postalCode,
          countryCode: options.fromAddress.country
        },
        recipientAddress: {
          contactName: options.toAddress.contactName || 'Recipient',
          companyName: options.toAddress.companyName || '',
          phone: options.toAddress.phone,
          email: options.toAddress.email || '',
          addressLine1: options.toAddress.addressLine1 || '',
          addressLine2: options.toAddress.addressLine2 || '',
          city: options.toAddress.city,
          state: options.toAddress.state,
          postalCode: options.toAddress.postalCode,
          countryCode: options.toAddress.countryCode
        },
        packages: options.items.map(item => ({
          weight: item.weight,
          length: item.dimensions.length,
          width: item.dimensions.width,
          height: item.dimensions.height,
          description: `Order item ${item.id} (Qty: ${item.quantity})`
        })),
        reference: `Order-${Date.now()}`,
        serviceType: this.mapServiceLevelToType(options.serviceLevel)
      };
      
      // Create the shipment with the provider
      return await provider.createShipment(request);
    } catch (error) {
      logApiError('Create Shipment Error', error);
      throw error;
    }
  }
  
  /**
   * Map service level string to ShippingServiceType
   * @param serviceLevel Service level string
   * @returns Matching ShippingServiceType or undefined
   */
  private static mapServiceLevelToType(serviceLevel: string) {
    const serviceMap: Record<string, any> = {
      'standard': 'STANDARD',
      'express': 'EXPRESS',
      'priority': 'PRIORITY',
      'economy': 'ECONOMY'
    };
    
    return serviceMap[serviceLevel.toLowerCase()];
  }

  /**
   * Track a shipment by tracking number
   * @param trackingNumber Tracking number to track
   * @param providerName Optional provider name, if not specified will try all providers
   * @returns Tracking response from the provider that successfully tracked the shipment
   */
  static async trackShipment(trackingNumber: string, providerName?: string): Promise<TrackingResponse> {
    try {
      if (providerName) {
        // Track using a specific provider
        const provider = await ShippingProviderFactory.getProvider(providerName);
        const response = await provider.trackShipment({ trackingNumber });
        response.providerName = provider.getProviderName();
        return response;
      } else {
        // Try tracking with all providers in parallel
        const providers = await ShippingProviderFactory.getAllProviders();
        const trackingPromises = providers.map(provider => 
          provider.trackShipment({ trackingNumber })
            .then(response => {
              response.providerName = provider.getProviderName();
              return response;
            })
            .catch(error => {
              logApiError(`${provider.getProviderName()}.trackShipment`, error);
              return null; // Return null on error
            })
        );
        
        const results = await Promise.all(trackingPromises);
        
        // Find the first successful tracking response
        const firstSuccessful = results.find(response => response !== null);
        
        if (firstSuccessful) {
          return firstSuccessful;
        }
        
        throw new Error(`Unable to track shipment with tracking number: ${trackingNumber}`);
      }
    } catch (error) {
      logApiError('ShippingService.trackShipment', error);
      throw error;
    }
  }

  /**
   * Validate a shipping address
   * @param address Address to validate
   * @param providerName Optional provider name, uses default if not specified
   * @returns Validation result
   */
  static async validateAddress(address: ShippingAddress, providerName?: string): Promise<{ 
    isValid: boolean; 
    suggestedAddress?: ShippingAddress;
    provider?: string;
  }> {
    try {
      // Try to get the specified provider or default
      const provider = await ShippingProviderFactory.getProvider(providerName);
      try {
        // Convert ShippingAddress to Address format
        const addressForValidation = {
          street: address.addressLine1 || '',
          addressLine2: address.addressLine2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          countryCode: address.countryCode
        };
        const result = await provider.validateAddress(addressForValidation);
        return {
          isValid: result.valid,
          suggestedAddress: result.suggestedAddress ? {
            contactName: address.contactName || '',
            companyName: address.companyName || '',
            phone: address.phone || '',
            email: address.email || '',
            addressLine1: result.suggestedAddress.street,
            addressLine2: result.suggestedAddress.addressLine2 || '',
            city: result.suggestedAddress.city,
            state: result.suggestedAddress.state || '',
            postalCode: result.suggestedAddress.postalCode,
            countryCode: result.suggestedAddress.countryCode
          } : undefined,
          provider: provider.getProviderName()
        };
      } catch (validationError) {
        // If the provider fails, try the next best provider
        if (!providerName) {
          // Mark this provider as not working
          ShippingProviderFactory.markProviderAsNotWorking(provider.getProviderName());
          
          // Try again with no specific provider - this will automatically get the next available
          console.warn(`Address validation failed with ${provider.getProviderName()}, trying another provider...`);
          return this.validateAddress(address);
        }
        throw validationError;
      }
    } catch (error) {
      logApiError('ShippingService.validateAddress', error);
      throw error;
    }
  }

  /**
   * Get names of all available shipping providers
   * @returns Array of provider names
   */
  static async getAvailableProviders(): Promise<string[]> {
    return await ShippingProviderFactory.getAvailableProviderNames();
  }

  /**
   * Get the default shipping provider name
   * @returns Default provider name
   */
  static async getDefaultProvider(): Promise<string> {
    return await ShippingProviderFactory.getDefaultProviderName();
  }

  /**
   * Set the default shipping provider
   * @param providerName Name of the provider to set as default
   */
  static async setDefaultProvider(providerName: string): Promise<void> {
    await ShippingProviderFactory.setDefaultProvider(providerName);
  }
}