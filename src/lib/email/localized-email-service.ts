import { sendEmail } from "./aws-ses";
import { getTranslations } from "next-intl/server";

/**
 * Send an email with content localized based on the recipient's preferred language
 */
export async function sendLocalizedEmail({
  to,
  subject,
  htmlBody,
  textBody,
  locale = "en",
  replacements = {}
}: {
  to: string;
  subject: string | Record<string, string>;
  htmlBody: string | Record<string, string>;
  textBody: string | Record<string, string>;
  locale?: string;
  replacements?: Record<string, string>;
}) {
  try {
    // Handle localization of subject and body
    const localizedSubject = typeof subject === 'string' 
      ? subject 
      : subject[locale] || subject['en'] || Object.values(subject)[0];
      
    const localizedHtmlBody = typeof htmlBody === 'string'
      ? htmlBody
      : htmlBody[locale] || htmlBody['en'] || Object.values(htmlBody)[0];
      
    const localizedTextBody = typeof textBody === 'string'
      ? textBody
      : textBody[locale] || textBody['en'] || Object.values(textBody)[0];
    
    // Apply replacements 
    let finalHtmlBody = localizedHtmlBody;
    let finalTextBody = localizedTextBody;
    
    // Add current year replacement
    replacements = {
      ...replacements,
      currentYear: new Date().getFullYear().toString()
    };
    
    // Apply all replacements
    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      finalHtmlBody = finalHtmlBody.replace(regex, value);
      finalTextBody = finalTextBody.replace(regex, value);
    });
    
    // Send email through AWS SES
    return await sendEmail({
      to,
      subject: localizedSubject,
      htmlBody: finalHtmlBody,
      textBody: finalTextBody,
    });
  } catch (error) {
    console.error("Failed to send localized email:", error);
    throw error;
  }
}

/**
 * Prepare and send a newsletter email with localized content
 */
export async function sendNewsletterEmail({
  to,
  name = "",
  emailType,
  locale = "en",
  data = {}
}: {
  to: string;
  name?: string;
  emailType: "verification" | "subscription" | "unsubscribe";
  locale?: string;
  data: Record<string, any>;
}) {
  // Load subject translations
  const subjects = {
    en: {
      verification: "Verify Your Newsletter Subscription",
      subscription: "Welcome to Our Newsletter!",
      unsubscribe: "Unsubscribe Confirmation"
    },
    nl: {
      verification: "Verifieer Uw Nieuwsbrief Inschrijving",
      subscription: "Welkom bij Onze Nieuwsbrief!",
      unsubscribe: "Uitschrijving Bevestiging"
    }
  };
  
  // Choose the subject based on emailType and locale
  const subject = subjects[locale as keyof typeof subjects]?.[emailType] || 
                  subjects.en[emailType];
  
  // Load template content
  // In a production app, these would be loaded from files
  
  // For now, send the email with basic parameters
  return await sendLocalizedEmail({
    to,
    subject,
    htmlBody: `<p>This is a placeholder for ${emailType} in ${locale}</p>`,
    textBody: `This is a placeholder for ${emailType} in ${locale}`,
    locale,
    replacements: {
      name,
      ...data
    }
  });
} 