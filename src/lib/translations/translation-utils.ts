import fs from 'fs/promises';
import pathModule from 'path';

/**
 * Interface for translation entries
 */
export interface TranslationEntry {
  key: string;
  path: string;
  enValue: string | null;
  nlValue: string | null;
  status: 'complete' | 'missing' | 'partial'; // complete = both, partial = one, missing = none
}

/**
 * Deeply traverse an object and collect all leaf paths
 */
function collectPaths(
  obj: any, 
  parentPath: string = '', 
  result: Record<string, string> = {}
) {
  if (typeof obj !== 'object' || obj === null) {
    result[parentPath] = obj;
    return result;
  }
  
  Object.entries(obj).forEach(([key, value]) => {
    const currentPath = parentPath ? `${parentPath}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      collectPaths(value, currentPath, result);
    } else {
      result[currentPath] = value;
    }
  });
  
  return result;
}

/**
 * Set a value at a specific path in an object
 */
export function setValueAtPath(obj: any, path: string, value: any): any {
  const pathParts = path.split('.');
  const leafProperty = pathParts.pop()!;
  
  // Create a copy of the object to avoid mutating the original
  const result = JSON.parse(JSON.stringify(obj));
  
  let current = result;
  
  // Navigate to the correct location in the object
  for (const part of pathParts) {
    if (!(part in current)) {
      current[part] = {};
    }
    current = current[part];
  }
  
  // Set the value
  current[leafProperty] = value;
  
  return result;
}

/**
 * Compare translations between locales to identify missing translations
 */
export async function findMissingTranslations(): Promise<TranslationEntry[]> {
  const translations: Record<string, any> = {};
  const locales = ['en', 'nl'];
  
  // Load all translation files
  for (const locale of locales) {
    const filePath = pathModule.join(process.cwd(), 'messages', `${locale}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    translations[locale] = JSON.parse(fileContent);
  }
  
  // Flatten the nested structures to path/value pairs
  const flattenedPaths: Record<string, Record<string, string>> = {};
  
  for (const locale of locales) {
    flattenedPaths[locale] = collectPaths(translations[locale]);
  }
  
  // Combine all unique paths
  const allPaths = new Set([
    ...Object.keys(flattenedPaths.en || {}),
    ...Object.keys(flattenedPaths.nl || {})
  ]);
  
  // Create translation entries
  const entries: TranslationEntry[] = Array.from(allPaths).map(path => {
    const enValue = flattenedPaths.en?.[path] || null;
    const nlValue = flattenedPaths.nl?.[path] || null;
    
    let status: 'complete' | 'missing' | 'partial';
    if (enValue && nlValue) {
      status = 'complete';
    } else if (!enValue && !nlValue) {
      status = 'missing';
    } else {
      status = 'partial';
    }
    
    // Extract the last segment as the key
    const pathParts = path.split('.');
    const key = pathParts[pathParts.length - 1];
    
    return {
      key,
      path,
      enValue,
      nlValue,
      status
    };
  });
  
  return entries;
}

/**
 * Update a translation in a specific locale file
 */
export async function updateTranslation(
  locale: string, 
  path: string, 
  value: string
): Promise<boolean> {  try {
    // Read the current translation file
    const filePath = pathModule.join(process.cwd(), 'messages', `${locale}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const translations = JSON.parse(fileContent);
    
    // Update the value using the utility function
    const updatedTranslations = setValueAtPath(translations, path, value);
    
    // Write the updated translations back to the file
    await fs.writeFile(filePath, JSON.stringify(updatedTranslations, null, 2));
    
    return true;
  } catch (error) {
    console.error('Error updating translation:', error);
    return false;
  }
}

/**
 * Export translations for a specific locale
 */
export async function exportTranslations(locale: string): Promise<any> {
  try {
    const filePath = pathModule.join(process.cwd(), 'messages', `${locale}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error exporting translations:', error);
    throw error;
  }
}

/**
 * Import translations for a specific locale
 */
export async function importTranslations(locale: string, translations: any): Promise<boolean> {
  try {
    const filePath = pathModule.join(process.cwd(), 'messages', `${locale}.json`);
    await fs.writeFile(filePath, JSON.stringify(translations, null, 2));
    return true;
  } catch (error) {
    console.error('Error importing translations:', error);
    return false;
  }
}
