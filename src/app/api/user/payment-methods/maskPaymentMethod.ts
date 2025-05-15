// Helper function to mask sensitive card data
export function maskPaymentMethod(method: any) {
  return {
    id: method.id,
    type: method.type,
    brand: method.cardBrand,
    last4: method.last4,
    expiryMonth: method.expiryMonth,
    expiryYear: method.expiryYear,
    isDefault: method.isDefault,
    stripePaymentMethodId: method.stripePaymentMethodId,
    billingAddressId: method.billingAddressId,
    
    // Include billing address details if available
    billingAddressObject: method.billingAddress ? {
      id: method.billingAddress.id,
      firstName: method.billingAddress.firstName,
      lastName: method.billingAddress.lastName,
      addressLine1: method.billingAddress.addressLine1,
      addressLine2: method.billingAddress.addressLine2,
      city: method.billingAddress.city,
      state: method.billingAddress.state,
      postalCode: method.billingAddress.postalCode,
      country: method.billingAddress.country,
      phoneNumber: method.billingAddress.phoneNumber
    } : null,
    
    // Legacy fields for backwards compatibility
    billingName: method.billingName,
    billingEmail: method.billingEmail,
    // Using legacyBillingAddress instead of billingAddress to avoid name conflict
    legacyBillingAddress: method.billingAddress?.addressLine1 || method.billingAddressLine,
    billingCity: method.billingAddress?.city || method.billingCity,
    billingState: method.billingAddress?.state || method.billingState,
    billingPostalCode: method.billingAddress?.postalCode || method.billingPostalCode,
    billingCountry: method.billingAddress?.country || method.billingCountry,
  };
}
