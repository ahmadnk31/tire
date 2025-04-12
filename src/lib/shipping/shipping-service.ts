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
   * Create a shipment using the specified provider or the default provider
   * @param request Shipment request parameters
   * @param providerName Optional provider name, uses default if not specified
   * @returns Shipment creation response
   */
  static async createShipment(request: ShipmentRequest, providerName?: string): Promise<ShipmentResponse> {
    try {
      const provider = await ShippingProviderFactory.getProvider(providerName);
      return await provider.createShipment(request);
    } catch (error) {
      logApiError('ShippingService.createShipment', error);
      throw error;
    }
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
        const result = await provider.validateAddress(address);
        return {
          ...result,
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