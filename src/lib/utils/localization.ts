/**
 * Utility functions for working with localized content
 */

/**
 * Gets localized content based on the current locale with fallback to default content
 * 
 * @param localizedContent Record of localized content with language codes as keys
 * @param defaultContent Default content to use as fallback
 * @param locale Current locale/language code
 * @returns The localized content for the requested locale or default if not available
 */
export function getLocalizedContent(
  localizedContent: Record<string, string> | null | undefined,
  defaultContent: string | null | undefined,
  locale: string
): string | null {
  // If we have localized content and content for the requested locale exists
  if (localizedContent && localizedContent[locale]) {
    return localizedContent[locale];
  }
  
  // Fall back to default content
  return defaultContent || null;
}

/**
 * Gets localized description for a product
 * 
 * @param product The product object containing description and localized_descriptions
 * @param locale Current locale/language code
 * @returns The localized description or default description as fallback
 */
export function getLocalizedDescription(
  product: { 
    description: string | null; 
    localized_descriptions: Record<string, string> | null;
  }, 
  locale: string
): string | null {
  return getLocalizedContent(product.localized_descriptions, product.description, locale);
}

/**
 * Gets localized short description for a product
 * 
 * @param product The product object containing short_description and localized_short_descriptions
 * @param locale Current locale/language code
 * @returns The localized short description or default short description as fallback
 */
export function getLocalizedShortDescription(
  product: { 
    short_description: string | null; 
    localized_short_descriptions: Record<string, string> | null;
  }, 
  locale: string
): string | null {
  return getLocalizedContent(product.localized_short_descriptions, product.short_description, locale);
} 