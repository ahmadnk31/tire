import { FedExProvider } from './providers/fedex-provider';
import { DHLShippingProvider } from './providers/dhl-provider';
import { GLSShippingProvider } from './providers/gls-provider';
import { ShippingProvider } from './shipping-interfaces';
import { prisma } from '@/lib/db';

// Detect if we're running in a browser environment (client component)
const isBrowser = typeof window !== 'undefined';

// Key for storing the default shipping provider in the database
const DEFAULT_SHIPPING_PROVIDER_KEY = 'default_shipping_provider';

/**
 * Factory class for creating and managing shipping provider instances
 */
export class ShippingProviderFactory {
  private static providers = new Map<string, ShippingProvider>();
  private static defaultProvider: string | null = null;
  private static providerStatus = new Map<string, boolean>();
  private static initialized = false;

  /**
   * Initialize all shipping providers
   * Called automatically when the first provider is requested
   */
  private static async initializeProviders() {
    // Only initialize once
    if (this.initialized) return;
    
    // Create provider instances
    const fedexProvider = new FedExProvider();
    const dhlProvider = new DHLShippingProvider();
    const glsProvider = new GLSShippingProvider();

    // Register providers
    this.providers.set(fedexProvider.getProviderName().toLowerCase(), fedexProvider);
    this.providers.set(dhlProvider.getProviderName().toLowerCase(), dhlProvider);
    this.providers.set(glsProvider.getProviderName().toLowerCase(), glsProvider);

    // Initially mark all providers as potentially working
    this.providerStatus.set('fedex', true);
    this.providerStatus.set('dhl', true);
    this.providerStatus.set('gls', true);

    try {
      // Only try to use Prisma if we're in a server context
      if (!isBrowser) {
        // Try to get default provider from database first
        const dbSetting = await prisma.systemSetting.findUnique({
          where: { key: DEFAULT_SHIPPING_PROVIDER_KEY }
        });
        
        if (dbSetting) {
          // Use the database setting if available
          this.defaultProvider = dbSetting.value.toLowerCase();
        } else {
          // Fall back to environment variable or default to DHL
          this.defaultProvider = process.env.DEFAULT_SHIPPING_PROVIDER?.toLowerCase() || 'dhl';
        }
      } else {
        // In browser context, just use the environment variable or default
        this.defaultProvider = process.env.DEFAULT_SHIPPING_PROVIDER?.toLowerCase() || 'dhl';
      }
    } catch (error) {
      console.error("Error loading default shipping provider from database:", error);
      // Fall back to environment variable or default to DHL
      this.defaultProvider = process.env.DEFAULT_SHIPPING_PROVIDER?.toLowerCase() || 'dhl';
    }
    
    this.initialized = true;
  }

  /**
   * Get a shipping provider by name
   * @param providerName Optional provider name, uses default if not provided
   * @returns ShippingProvider instance
   */
  static async getProvider(providerName?: string): Promise<ShippingProvider> {
    await this.initializeProviders();

    const providerKey = providerName?.toLowerCase() || this.defaultProvider;
    
    // If the requested provider is not available or marked as not working
    if (!providerKey || !this.providers.has(providerKey) || this.providerStatus.get(providerKey) === false) {
      // If a specific provider was requested but it's not working
      if (providerName) {
        console.warn(`Shipping provider "${providerName}" is not available or not working, using default.`);
      }
      
      // Try to use the default provider
      if (this.defaultProvider && this.providers.has(this.defaultProvider) && 
          this.providerStatus.get(this.defaultProvider) !== false) {
        return this.providers.get(this.defaultProvider)!;
      }
      
      // If default is also not working, find any working provider
      for (const [key, isWorking] of this.providerStatus.entries()) {
        if (isWorking && this.providers.has(key)) {
          return this.providers.get(key)!;
        }
      }
      
      // Last resort - just return any provider even if marked as not working
      return this.providers.get([...this.providers.keys()][0])!;
    }

    return this.providers.get(providerKey)!;
  }

  /**
   * Mark a provider as having an authentication or configuration issue
   * @param providerName Name of the provider with issues
   */
  static markProviderAsNotWorking(providerName: string): void {
    const providerKey = providerName.toLowerCase();
    this.providerStatus.set(providerKey, false);
    
    // If this was the default provider, try to switch to another one
    if (this.defaultProvider === providerKey) {
      console.warn(`Default shipping provider "${providerName}" is not working, switching to another provider.`);
      
      // Find a working alternative
      for (const [key, isWorking] of this.providerStatus.entries()) {
        if (isWorking && key !== providerKey) {
          this.defaultProvider = key;
          break;
        }
      }
    }
  }

  /**
   * Get all registered shipping providers
   * @returns Array of ShippingProvider instances
   */
  static async getAllProviders(): Promise<ShippingProvider[]> {
    await this.initializeProviders();
    return Array.from(this.providers.values());
  }

  /**
   * Get available provider names
   * @returns Array of provider names
   */
  static async getAvailableProviderNames(): Promise<string[]> {
    await this.initializeProviders();
    return Array.from(this.providers.keys()).map(key => {
      // Get the properly cased name
      const provider = this.providers.get(key)!;
      return provider.getProviderName();
    });
  }

  /**
   * Get the default provider name
   * @returns The default provider name
   */
  static async getDefaultProviderName(): Promise<string> {
    await this.initializeProviders();
    if (!this.defaultProvider || !this.providers.has(this.defaultProvider)) {
      return 'DHL'; // Changed fallback from FedEx to DHL
    }
    
    // Return the properly cased name
    const provider = this.providers.get(this.defaultProvider)!;
    return provider.getProviderName();
  }
  
  /**
   * Set the default provider
   * @param providerName The provider name to set as default
   */
  static async setDefaultProvider(providerName: string): Promise<void> {
    await this.initializeProviders();
    const providerKey = providerName.toLowerCase();
    
    if (!this.providers.has(providerKey)) {
      console.warn(`Cannot set default provider: "${providerName}" not found`);
      return;
    }
    
    this.defaultProvider = providerKey;
    
    // Update the database setting only if we're in a server context
    if (!isBrowser) {
      try {
        await prisma.systemSetting.upsert({
          where: { key: DEFAULT_SHIPPING_PROVIDER_KEY },
          update: { value: providerName },
          create: { key: DEFAULT_SHIPPING_PROVIDER_KEY, value: providerName }
        });
      } catch (error) {
        console.error("Error saving default shipping provider to database:", error);
      }
    }
  }

  /**
   * Check if a provider exists by name
   * @param providerName Name of the provider to check
   * @returns True if the provider exists
   */
  static async hasProvider(providerName: string): Promise<boolean> {
    await this.initializeProviders();
    return this.providers.has(providerName.toLowerCase());
  }
  
  /**
   * Remove a provider by name
   * @param providerName Name of the provider to remove
   * @returns True if the provider was removed
   */
  static async removeProvider(providerName: string): Promise<boolean> {
    await this.initializeProviders();
    const providerKey = providerName.toLowerCase();
    
    // If this is the default provider, reset to another provider
    if (this.defaultProvider === providerKey) {
      const providers = (await this.getAvailableProviderNames())
        .filter(name => name.toLowerCase() !== providerKey);
      this.defaultProvider = providers.length > 0 ? providers[0].toLowerCase() : null;
    }
    
    return this.providers.delete(providerKey);
  }
}