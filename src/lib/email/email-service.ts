import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { EmailTemplate, TemplateData } from "./types";
import { getTranslations } from "next-intl/server";
import { render } from "./templates";



// Initialize SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
});

// Default sender email
const DEFAULT_FROM_EMAIL = process.env.DEFAULT_FROM_EMAIL || "no-reply@arianabandencentralebv.be";

/**
 * Send an email with content based on the user's language preference
 * 
 * @param to Recipient email
 * @param subject Email subject key (will be translated)
 * @param template Template name to use
 * @param templateData Data to pass to the template
 * @param locale User's preferred locale (e.g., 'en' or 'nl')
 */
export async function sendLocalizedEmail<T extends TemplateData>({
  to,
  subject,
  template,
  templateData,
  locale = "en",
}: {
  to: string;
  subject: string;
  template: EmailTemplate;
  templateData: T;
  locale?: string;
}): Promise<boolean> {
  try {
    // Get translations for email subjects
    const t = await getTranslations( "Email");
    
    // Render email content in the user's language
    const { html, text } = await render(template, {
      ...templateData,
      locale,
    });

    // Send email through AWS SES
    const command = new SendEmailCommand({
      Source: DEFAULT_FROM_EMAIL,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: t(subject),
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: html,
            Charset: "UTF-8",
          },
          Text: {
            Data: text,
            Charset: "UTF-8",
          },
        },
      },
    });

    await sesClient.send(command);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}
