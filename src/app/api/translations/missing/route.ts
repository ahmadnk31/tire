import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { findMissingTranslations } from "@/lib/translations/translation-utils";

/**
 * GET: Find missing translations across locales
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
    
    // Find missing translations
    const translations = await findMissingTranslations();
    
    return NextResponse.json({ 
      translations,
      summary: {
        total: translations.length,
        missing: translations.filter(t => t.status === 'missing').length,
        partial: translations.filter(t => t.status === 'partial').length,
        complete: translations.filter(t => t.status === 'complete').length
      }
    });
  } catch (error: any) {
    console.error('Error finding missing translations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to find missing translations' },
      { status: 500 }
    );
  }
}
