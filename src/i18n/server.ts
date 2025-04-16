import fs from 'fs/promises';
import path from 'path';

/**
 * Simple utility to get translations for server-side components like email templates
 * 
 * @param locale The locale to use (e.g., 'en', 'nl')
 * @param namespace Optional namespace to select a specific section of translations
 * @returns A function that accepts a key and returns the translated string
 */
export async function getTranslations(
  locale: string = 'en',
  namespace?: string
): Promise<(key: string, params?: Record<string, any>) => string> {
  // Default to English if the requested locale is not supported
  const validLocale = ['en', 'nl'].includes(locale) ? locale : 'en';
  
  try {
    // Load the translation file for the specified locale
    const filePath = path.join(process.cwd(), 'messages', `${validLocale}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const translations = JSON.parse(fileContent);
    
    // Return a function that can retrieve translations by key
    return (key: string, params?: Record<string, any>) => {
      // If namespace is provided, look within that section
      const baseTranslations = namespace 
        ? translations[namespace] || {} 
        : translations;
      
      // Split the key by dots and traverse the translations object
      const keyParts = key.split('.');
      let value = baseTranslations;
      
      for (const part of keyParts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          // Key not found, return the key itself as fallback
          return key;
        }
      }
      
      // If the value is not a string, return the key as fallback
      if (typeof value !== 'string') {
        return key;
      }
      
      // Replace parameters if provided
      if (params) {
        return Object.entries(params).reduce((result, [paramName, paramValue]) => {
          return result.replace(new RegExp(`{{${paramName}}}`, 'g'), String(paramValue));
        }, value);
      }
      
      return value;
    };
  } catch (error) {
    console.error(`Failed to load translations for ${locale}:`, error);
    // Return a function that just returns the key as fallback
    return (key) => key;
  }
}
