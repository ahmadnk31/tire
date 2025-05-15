import { prisma } from "@/lib/db";
import { NewsletterStatus } from "@prisma/client";
import { sendNewsletter } from "./newsletter-service";

/**
 * Processes scheduled newsletters that are due to be sent
 * This function should be called by a cron job at regular intervals
 */
export async function processScheduledNewsletters() {
  const now = new Date();
  
  try {
    // Find newsletters that are scheduled and due to be sent
    const scheduledNewsletters = await prisma.newsletter.findMany({
      where: {
        status: NewsletterStatus.SCHEDULED,
        scheduledFor: {
          lte: now, // Less than or equal to now
        },
      },
    });

    console.log(`Found ${scheduledNewsletters.length} newsletters to process`);
    
    // Process each newsletter
    for (const newsletter of scheduledNewsletters) {
      try {
        console.log(`Processing scheduled newsletter: ${newsletter.id}`);
        
        // Update status to SENDING
        await prisma.newsletter.update({
          where: { id: newsletter.id },
          data: { status: NewsletterStatus.SENDING }
        });
        
        // Send the newsletter
        await sendNewsletter(newsletter.id);
        
      } catch (error) {
        console.error(`Error processing newsletter ${newsletter.id}:`, error);
        
        // Update status to FAILED
        await prisma.newsletter.update({
          where: { id: newsletter.id },
          data: { 
            status: NewsletterStatus.FAILED,
            // Store error message in a way that doesn't break anything if it's too long
            // This would ideally go into a separate logging table in a production environment
          }
        });
      }
    }
    
    return {
      processed: scheduledNewsletters.length,
      timestamp: now.toISOString(),
    };
  } catch (error) {
    console.error("Error in newsletter scheduler:", error);
    throw error;
  }
}
