import { prisma } from "@/lib/db";
import { sendBulkEmail, sendEmail } from "./aws-ses";
import { NewsletterStatus } from "@prisma/client";

/**
 * Sends a newsletter to all subscribers in the specified groups
 */
export async function sendNewsletter(newsletterId: string) {
  try {
    // Get newsletter with recipient groups
    const newsletter = await prisma.newsletter.findUnique({
      where: { id: newsletterId },
      include: {
        recipientGroups: true,
      },
    });

    if (!newsletter) {
      throw new Error(`Newsletter with ID ${newsletterId} not found`);
    }

    // Get all subscribers from the recipient groups
    const subscribersByGroup = await Promise.all(
      newsletter.recipientGroups.map(async (group) => {
        return prisma.subscriber.findMany({
          where: {
            groups: {
              some: {
                id: group.id,
              },
            },
            subscribed: true, // Only send to active subscribers
          },
          select: {
            id: true,
            email: true,
            name: true,
            preferredLanguage: true, // Get the subscriber's preferred language
          },
        });
      })
    );

    // Flatten and remove duplicates (a subscriber may be in multiple groups)
    const subscribers = Array.from(
      new Map(
        subscribersByGroup.flat().map((s) => [s.email, s])
      ).values()
    );

    if (subscribers.length === 0) {
      console.log(`No subscribers found for newsletter ${newsletterId}`);
      // Update status to SENT but with 0 recipients
      await prisma.newsletter.update({
        where: { id: newsletterId },
        data: {
          status: NewsletterStatus.SENT,
          sentAt: new Date(),
          recipientCount: 0,
        },
      });
      return { success: true, recipientCount: 0 };
    }

    // Update newsletter status to SENDING
    await prisma.newsletter.update({
      where: { id: newsletterId },
      data: {
        status: NewsletterStatus.SENDING,
      },
    });

    // Group subscribers by their preferred language to send localized content
    const subscribersByLocale = subscribers.reduce((acc, subscriber) => {
      const locale = subscriber.preferredLanguage || 'en'; // Default to English if no preference set
      if (!acc[locale]) {
        acc[locale] = [];
      }
      acc[locale].push(subscriber);
      return acc;
    }, {} as Record<string, typeof subscribers>);

    let successfulSends = 0;
    let totalSendAttempts = 0;

    // Send emails to each group of subscribers by locale
    for (const [locale, localeSubscribers] of Object.entries(subscribersByLocale)) {
      console.log(`Sending newsletters to ${localeSubscribers.length} subscribers in ${locale} locale`);
      
      // Get the list of emails for this locale group
      const recipientEmails = localeSubscribers.map(s => s.email);
      totalSendAttempts += recipientEmails.length;
      
      // Send the newsletter to this language group with localized content
      const emailResults = await sendBulkEmail({
        to: recipientEmails,
        subject: newsletter.subject, // Ideally, this would be translated based on locale
        htmlBody: formatNewsletterHtml(newsletter.content, newsletter, locale),
        textBody: formatNewsletterText(newsletter.content, locale),
      });
      
      // Count successful sends for this locale group
      successfulSends += emailResults.filter((r) => r.success).length;
    }
    
    // Update the newsletter record with sent information
    await prisma.newsletter.update({
      where: { id: newsletterId },
      data: {
        status: NewsletterStatus.SENT,
        sentAt: new Date(),
        recipientCount: successfulSends,
      },
    });

    return {
      success: true,
      recipientCount: successfulSends,
      totalRecipients: totalSendAttempts,
    };
  } catch (error) {
    console.error("Error sending newsletter:", error);
    
    // Update the newsletter status to FAILED
    await prisma.newsletter.update({
      where: { id: newsletterId },
      data: {
        status: NewsletterStatus.FAILED,
      },
    });
    
    throw error;
  }
}

/**
 * Format newsletter content as HTML with proper styling
 * Preserves TipTap's HTML formatting while adding email template structure
 */
function formatNewsletterHtml(content: string, newsletter: any, locale: string = 'en') {
  // Get localized unsubscribe text
  const localizations: Record<string, { unsubscribe: string, updatePreferences: string, companyName: string }> = {
    'en': {
      unsubscribe: 'Unsubscribe',
      updatePreferences: 'Update preferences',
      companyName: 'Your Tire Company'
    },
    'nl': {
      unsubscribe: 'Uitschrijven',
      updatePreferences: 'Voorkeuren bijwerken',
      companyName: 'Uw Bandenbedrijf'
    }
  };
  
  // Use the requested locale or fall back to English
  const localized = localizations[locale] || localizations['en'];
  
  return `
    <!DOCTYPE html>
    <html lang="${locale}">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${newsletter.subject}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          border-bottom: 3px solid #e9ecef;
        }
        .content {
          padding: 20px;
        }
        .footer {
          font-size: 12px;
          color: #6c757d;
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #0d6efd;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
        }
        /* TipTap specific styling for email clients */
        img {
          max-width: 100%;
          height: auto;
        }
        h1 {
          font-size: 24px;
          margin-top: 16px;
          margin-bottom: 16px;
        }
        h2 {
          font-size: 20px;
          margin-top: 14px;
          margin-bottom: 14px;
        }
        h3 {
          font-size: 18px;
          margin-top: 12px;
          margin-bottom: 12px;
        }
        ul, ol {
          padding-left: 24px;
        }
        blockquote {
          border-left: 4px solid #e9ecef;
          padding-left: 16px;
          margin-left: 0;
          color: #6c757d;
        }
        p {
          margin-bottom: 16px;
        }
        .align-left {
          text-align: left;
        }
        .align-center {
          text-align: center;
        }
        .align-right {
          text-align: right;
        }
        .align-justify {
          text-align: justify;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${newsletter.title}</h1>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} ${localized.companyName}. All rights reserved.</p>
        <p>          <a href="{{unsubscribe_link}}">${localized.unsubscribe}</a> |
          <a href="{{preferences_link}}">${localized.updatePreferences}</a>
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Format newsletter content as plain text
 * Converts HTML content from TipTap to plain text format
 */
function formatNewsletterText(content: string, locale: string = 'en') {
  // Get localized footer text
  const localizations: Record<string, { unsubscribe: string, updatePreferences: string, companyName: string }> = {
    'en': {
      unsubscribe: 'Unsubscribe',
      updatePreferences: 'Update preferences',
      companyName: 'Your Tire Company'
    },
    'nl': {
      unsubscribe: 'Uitschrijven',
      updatePreferences: 'Voorkeuren bijwerken',
      companyName: 'Uw Bandenbedrijf'
    }
  };
  
  // Use the requested locale or fall back to English
  const localized = localizations[locale] || localizations['en'];

  // Convert HTML to plain text
  let textContent = content.replace(/<br\s*\/?>/gi, '\n');  // Replace <br> with newlines
  textContent = textContent.replace(/<\/p>/gi, '\n\n');     // Replace </p> with double newlines
  textContent = textContent.replace(/<li>/gi, '• ');        // Replace list items with bullets
  textContent = textContent.replace(/<\/li>/gi, '\n');      // End list items with newline
  textContent = textContent.replace(/<\/h[1-6]>/gi, '\n\n'); // Add newlines after headings
  textContent = textContent.replace(/<[^>]*>?/gm, '');      // Remove all remaining HTML tags
  
  // Fix HTML entities
  textContent = textContent
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
  
  // Normalize multiple line breaks
  textContent = textContent.replace(/\n\s*\n\s*\n+/g, '\n\n');
  
  // Add plain text footer
  textContent += `\n\n--\n© ${new Date().getFullYear()} ${localized.companyName}. All rights reserved.\n`;
  textContent += `${localized.unsubscribe}: {{unsubscribe_link}} | ${localized.updatePreferences}: {{preferences_link}}`;
  
  return textContent;
}
