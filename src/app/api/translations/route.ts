import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import fs from 'fs/promises';
import pathModule from 'path';

/**
 * GET: Retrieve all translation data or specific locale
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only admins can manage translations
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const url = new URL(req.url);
    const locale = url.searchParams.get('locale');
    
    if (locale) {
      // Return a specific locale's translations
      if (!['en', 'nl'].includes(locale)) {
        return NextResponse.json(
          { error: `Unsupported locale: ${locale}` },
          { status: 400 }
        );
      }
        const filePath = pathModule.join(process.cwd(), 'messages', `${locale}.json`);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const translations = JSON.parse(fileContent);
      
      return NextResponse.json({ locale, translations });
    } else {
      // Return all locales
      const locales = ['en', 'nl'];
      const allTranslations: Record<string, any> = {};
        for (const loc of locales) {
        const filePath = pathModule.join(process.cwd(), 'messages', `${loc}.json`);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        allTranslations[loc] = JSON.parse(fileContent);
      }
      
      return NextResponse.json({ translations: allTranslations });
    }
  } catch (error: any) {
    console.error('Error fetching translations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch translations' },
      { status: 500 }
    );
  }
}

/**
 * POST: Update translations for a specific locale
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only admins can manage translations
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
      const body = await req.json();
    const { locale, path: translationPath, value } = body;
    
    if (!locale || !translationPath || value === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: locale, translationPath, value" },
        { status: 400 }
      );
    }
    
    if (!['en', 'nl'].includes(locale)) {
      return NextResponse.json(
        { error: `Unsupported locale: ${locale}` },
        { status: 400 }
      );
    }      // Read the current translation file
    const filePath = pathModule.join(process.cwd(), 'messages', `${locale}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const translations = JSON.parse(fileContent);
    
    // Update the nested path with the new value
    const pathParts = translationPath.split('.');
    let current = translations;
    
    // Navigate to the nested location
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }
    
    // Set the value at the final path
    current[pathParts[pathParts.length - 1]] = value;
      // Write the updated translations back to the file
    await fs.writeFile(filePath, JSON.stringify(translations, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      message: `Translation updated successfully for ${locale}: ${translationPath}` 
    });
  } catch (error: any) {
    console.error('Error updating translations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update translations' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Import translations (bulk update)
 */
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only admins can manage translations
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { locale, translations } = body;
    
    if (!locale || !translations) {
      return NextResponse.json(
        { error: "Missing required fields: locale, translations" },
        { status: 400 }
      );
    }
    
    if (!['en', 'nl'].includes(locale)) {
      return NextResponse.json(
        { error: `Unsupported locale: ${locale}` },
        { status: 400 }
      );
    }
    
    // Validate that translations is an object
    if (typeof translations !== 'object' || translations === null) {
      return NextResponse.json(
        { error: "Translations must be an object" },
        { status: 400 }
      );
    }
      // Write the translations to the file
    const filePath = pathModule.join(process.cwd(), 'messages', `${locale}.json`);
    await fs.writeFile(filePath, JSON.stringify(translations, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      message: `Translations imported successfully for ${locale}` 
    });
  } catch (error: any) {
    console.error('Error importing translations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import translations' },
      { status: 500 }
    );
  }
}
