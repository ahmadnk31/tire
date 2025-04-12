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

    // Prepare recipient list
    const recipientEmails = subscribers.map((s) => s.email);

    // Send the newsletter
    const emailResults = await sendBulkEmail({
      to: recipientEmails,
      subject: newsletter.subject,
      htmlBody: formatNewsletterHtml(newsletter.content, newsletter),
      textBody: formatNewsletterText(newsletter.content),
    });

    // Count successful sends
    const successfulSends = emailResults.filter((r) => r.success).length;
    
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
      totalRecipients: recipientEmails.length,
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
 */
function formatNewsletterHtml(content: string, newsletter: any) {
  return `
    <!DOCTYPE html>
    <html>
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
        img {
          max-width: 100%;
          height: auto;
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
        <p>© ${new Date().getFullYear()} Your Tire Company. All rights reserved.</p>
        <p>
          <a href="{{unsubscribe_link}}">Unsubscribe</a> |
          <a href="{{preferences_link}}">Update preferences</a>
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Format newsletter content as plain text
 */
function formatNewsletterText(content: string) {
  // Simple conversion - strip HTML tags for text version
  const textContent = content.replace(/<[^>]*>?/gm, '');
  return textContent
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}
