"use client";

import { ShippingAddress as CartShippingAddress, ShippingOption } from "@/contexts/cart-context";
import { CartItem } from "@/contexts/cart-context";

// This function maps our cart context address format to the shipping API format
const mapToShippingAddress = (address: CartShippingAddress) => {
  return {
    contactName: `${address.firstName} ${address.lastName}`,
    companyName: "",
    phone: address.phone,
    email: address.email,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2 || "",
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    countryCode: address.country
  };
};

// This function converts the cart items to package details for the shipping API
const createPackageDetails = (items: CartItem[]) => {
  // If item has dimensions and weight, use those
  // Otherwise, use default values
  const packages = items.map(item => {
    return {
      weight: item.weight || 1, // Default weight in kg if not specified
      length: item.dimensions?.length || 30, // Default dimensions in cm
      width: item.dimensions?.width || 20,
      height: item.dimensions?.height || 10,
      description: item.name
    };
  });

  // If there are no items with dimensions, create a default package
  if (packages.length === 0) {
    packages.push({
      weight: 1, // 1kg
      length: 30, // 30cm
      width: 20, // 20cm
      height: 10, // 10cm
      description: "Tire package"
    });
  }

  return packages;
};

/**
 * Validates a shipping address with the shipping provider
 * @param address Shipping address to validate
 * @returns Validation result with suggested address if available
 */
export async function validateShippingAddress(address: CartShippingAddress) {
  try {
    // Convert address to the format expected by the API
    const addressToValidate = {
      street: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      countryCode: address.country
    };

    // Call our server-side address validation API
    const response = await fetch('/api/shipping/validate-address', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(addressToValidate)
    });

    if (!response.ok) {
      throw new Error('Address validation failed');
    }

    const data = await response.json();
    
    return {
      isValid: data.valid,
      suggestedAddress: data.suggestedAddress ? {
        firstName: address.firstName,
        lastName: address.lastName,
        email: address.email,
        phone: address.phone,
        addressLine1: data.suggestedAddress.street,
        addressLine2: data.suggestedAddress.addressLine2,
        city: data.suggestedAddress.city,
        state: data.suggestedAddress.state || address.state,
        postalCode: data.suggestedAddress.postalCode,
        country: data.suggestedAddress.countryCode
      } : null,
      messages: data.messages || []
    };
  } catch (error) {
    console.error('Error validating address:', error);
    return {
      isValid: false,
      suggestedAddress: null,
      messages: [(error as Error).message]
    };
  }
}

/**
 * Gets shipping rates based on origin, destination and items
 * @param shipperAddress The origin address
 * @param recipientAddress The destination address
 * @param items The cart items
 * @returns Array of shipping options with rates
 */
export async function getShippingRates(
  shipperAddress: CartShippingAddress,
  recipientAddress: CartShippingAddress,
  items: CartItem[]
): Promise<ShippingOption[]> {
  try {
    // Create the rate request payload
    const rateRequest = {
      shipperAddress: mapToShippingAddress(shipperAddress),
      recipientAddress: mapToShippingAddress(recipientAddress),
      packages: createPackageDetails(items)
    };

    // Call our server-side rates API
    const response = await fetch('/api/shipping/rates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(rateRequest)
    });

    if (!response.ok) {
      throw new Error('Failed to get shipping rates');
    }

    const data = await response.json();

    // If no rates were returned, use default rates
    if (!data.rates || data.rates.length === 0) {
      return [
        {
          id: "standard",
          name: "Standard Shipping",
          price: 9.99,
          estimatedDelivery: "3-5 Business Days",
          description: "Standard shipping with tracking"
        },
        {
          id: "express",
          name: "Express Shipping",
          price: 19.99,
          estimatedDelivery: "1-2 Business Days",
          description: "Fast delivery with tracking"
        }
      ];
    }

    // Map DHL rates to our shipping option format
    return data.rates.map((rate: any) => {
      const deliveryDate = rate.deliveryDate ? new Date(rate.deliveryDate) : null;
      const formattedDate = deliveryDate 
        ? deliveryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : `${rate.transitDays || 3}-5 days`;
      
      return {
        id: rate.rateId || rate.serviceType,
        name: `${rate.providerName} ${rate.serviceType.charAt(0) + rate.serviceType.slice(1).toLowerCase()}`,
        price: rate.totalAmount,
        estimatedDelivery: `Est. delivery by ${formattedDate}`,
        description: `${rate.providerName} ${rate.serviceType} delivery service`
      };
    });
  } catch (error) {
    console.error('Error getting shipping rates:', error);
    
    // Return default rates in case of error
    return [
      {
        id: "standard",
        name: "Standard Shipping",
        price: 9.99,
        estimatedDelivery: "3-5 Business Days",
        description: "Standard shipping with tracking"
      },
      {
        id: "express",
        name: "Express Shipping",
        price: 19.99,
        estimatedDelivery: "1-2 Business Days",
        description: "Fast delivery with tracking"
      }
    ];
  }
}

/**
 * Tests if the shipping API is working properly
 * @returns Authentication status
 */
export async function testShippingAuth(): Promise<{ authenticated: boolean, message: string }> {
  try {
    const response = await fetch('/api/shipping/auth-status');
    
    if (!response.ok) {
      throw new Error('Authentication check failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking shipping authentication:', error);
    return {
      authenticated: false,
      message: (error as Error).message
    };
  }
}
