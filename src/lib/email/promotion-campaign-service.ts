import { prisma } from "@/lib/db";
import { render } from "./templates";
import { sendBulkEmail } from "./aws-ses";
import { EmailTemplate } from "./types";
import { PromotionEmailCampaign } from "@prisma/client";

/**
 * Creates a new promotion email campaign
 */
export async function createPromotionCampaign({
  promotionId,
  name,
  subject,
  htmlTemplate,
  textTemplate,
  scheduledFor,
}: {
  promotionId: string;
  name: string;
  subject: string;
  htmlTemplate: string;
  textTemplate?: string;
  scheduledFor?: Date;
}): Promise<PromotionEmailCampaign> {
  try {
    const campaign = await prisma.promotionEmailCampaign.create({
      data: {
        promotionId,
        name,
        subject,
        htmlTemplate,
        textTemplate,
        scheduledFor,
        status: scheduledFor ? "scheduled" : "draft",
      },
      include: {
        promotion: true,
      },
    });

    return campaign;
  } catch (error) {
    console.error("Error creating promotion email campaign:", error);
    throw new Error("Failed to create promotion email campaign");
  }
}

/**
 * Gets all promotion email campaigns
 */
export async function getPromotionCampaigns(
  options?: {
    status?: string;
    promotionId?: string;
  }
): Promise<PromotionEmailCampaign[]> {
  try {
    const where: any = {};
    
    if (options?.status) {
      where.status = options.status;
    }
    
    if (options?.promotionId) {
      where.promotionId = options.promotionId;
    }
    
    const campaigns = await prisma.promotionEmailCampaign.findMany({
      where,
      include: {
        promotion: true,
      },
      orderBy: {
        scheduledFor: 'asc',
      },
    });

    return campaigns;
  } catch (error) {
    console.error("Error getting promotion email campaigns:", error);
    throw new Error("Failed to get promotion email campaigns");
  }
}

/**
 * Gets a promotion email campaign by ID
 */
export async function getPromotionCampaignById(id: string): Promise<PromotionEmailCampaign | null> {
  try {
    const campaign = await prisma.promotionEmailCampaign.findUnique({
      where: { id },
      include: {
        promotion: true,
      },
    });

    return campaign;
  } catch (error) {
    console.error(`Error getting promotion email campaign ${id}:`, error);
    throw new Error("Failed to get promotion email campaign");
  }
}

/**
 * Updates a promotion email campaign
 */
export async function updatePromotionCampaign(
  id: string,
  data: {
    name?: string;
    subject?: string;
    htmlTemplate?: string;
    textTemplate?: string;
    scheduledFor?: Date | null;
    status?: string;
  }
): Promise<PromotionEmailCampaign> {
  try {
    // If status isn't provided but scheduledFor is, update status accordingly
    if (data.scheduledFor !== undefined && data.status === undefined) {
      data.status = data.scheduledFor ? "scheduled" : "draft";
    }
    
    const campaign = await prisma.promotionEmailCampaign.update({
      where: { id },
      data,
      include: {
        promotion: true,
      },
    });

    return campaign;
  } catch (error) {
    console.error(`Error updating promotion email campaign ${id}:`, error);
    throw new Error("Failed to update promotion email campaign");
  }
}

/**
 * Deletes a promotion email campaign
 */
export async function deletePromotionCampaign(id: string): Promise<void> {
  try {
    await prisma.promotionEmailCampaign.delete({
      where: { id },
    });
  } catch (error) {
    console.error(`Error deleting promotion email campaign ${id}:`, error);
    throw new Error("Failed to delete promotion email campaign");
  }
}

/**
 * Sends a promotion email campaign
 */
export async function sendPromotionCampaign(campaignId: string): Promise<{ 
  success: boolean;
  totalSent: number;
  totalFailed: number;
}> {
  try {
    // Get campaign with promotion details
    const campaign = await prisma.promotionEmailCampaign.findUnique({
      where: { id: campaignId },
      include: {
        promotion: true,
      },
    });

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Don't send if campaign status isn't draft or scheduled
    if (campaign.status !== "draft" && campaign.status !== "scheduled") {
      throw new Error(`Campaign has status ${campaign.status} and cannot be sent`);
    }

    // Update campaign status to sending
    await prisma.promotionEmailCampaign.update({
      where: { id: campaignId },
      data: { status: "sending" },
    });

    // Get subscribers who opted in for promotional emails
    let recipients;

    // If the promotion targets specific subscriber groups
    if (campaign.promotion.target === "SPECIFIC_GROUP") {
      // Get the promotion with subscriber groups
      const promotionWithGroups = await prisma.promotion.findUnique({
        where: { id: campaign.promotionId },
        include: {
          subscriberGroups: true,
        },
      });

      if (!promotionWithGroups?.subscriberGroups || promotionWithGroups.subscriberGroups.length === 0) {
        // No specific groups, get all subscribers who opted in
        recipients = await prisma.subscriber.findMany({
          where: {
            subscribed: true,
          },
          select: {
            email: true,
            name: true,
          },
        });
      } else {
        // Get subscribers who belong to the specified groups
        const groupIds = promotionWithGroups.subscriberGroups.map(group => group.id);
        recipients = await prisma.subscriber.findMany({
          where: {
            subscribed: true,
            groups: {
              some: {
                id: {
                  in: groupIds,
                },
              },
            },
          },
          select: {
            email: true,
            name: true,
          },
        });
      }
    } else {
      // Get all subscribers who opted in
      recipients = await prisma.subscriber.findMany({
        where: {
          subscribed: true,
        },
        select: {
          email: true,
          name: true,
        },
      });
    }

    // Format promotion details for email
    const promotion = campaign.promotion;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com";
    
    // Send emails to all recipients
    const result = await sendBulkEmail({
      to: recipients.map(r => r.email),
      subject: campaign.subject,
      htmlBody: campaign.htmlTemplate,
      textBody: campaign.textTemplate || "",
    });

    // Update campaign with results
    await prisma.promotionEmailCampaign.update({
      where: { id: campaignId },
      data: {
        sentAt: new Date(),
        sentCount: result.totalSent,
        status: "completed",
      },
    });

    return {
      success: true,
      totalSent: result.totalSent,
      totalFailed: result.totalFailed,
    };
  } catch (error) {
    console.error(`Error sending promotion email campaign ${campaignId}:`, error);
    
    // Update campaign status to failed
    await prisma.promotionEmailCampaign.update({
      where: { id: campaignId },
      data: { status: "failed" },
    });
    
    throw new Error("Failed to send promotion email campaign");
  }
}

/**
 * Creates a campaign for appointment reminders from a promotion
 */
export async function createAppointmentPromotionCampaign({
  promotionId,
  appointmentType,
}: {
  promotionId: string;
  appointmentType: "confirmation" | "reminder";
}): Promise<PromotionEmailCampaign> {
  try {
    const promotion = await prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promotion) {
      throw new Error("Promotion not found");
    }

    // Determine the template name based on appointment type
    const template = appointmentType === "confirmation" ? 
      "appointmentConfirmation" : "appointmentReminder";
    
    // Generate subject based on promotion and appointment type
    const subject = appointmentType === "confirmation" 
      ? `Book your appointment for: ${promotion.title}`
      : `Reminder: Your appointment for ${promotion.title}`;
    
    // Create a name for the campaign
    const name = `${promotion.title} - ${appointmentType === "confirmation" ? "Appointment Booking" : "Appointment Reminder"}`;
    
    // Fetch templates
    const en = await render(template as EmailTemplate, {
      locale: 'en',
      userName: "{{userName}}",
      serviceType: "{{serviceType}}",
      appointmentDate: new Date(),
      appointmentTime: "{{appointmentTime}}",
      duration: "{{duration}}",
      vehicleInfo: "{{vehicleInfo}}",
      appointmentUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com"}/appointments/{{appointmentId}}`,
      baseUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com",
      formatServiceType: (type: string) => type,
      formatDate: (date: Date) => date.toLocaleDateString(),
    });
    
    // Create promotion email campaign with appointment templates
    const campaign = await prisma.promotionEmailCampaign.create({
      data: {
        promotionId,
        name,
        subject,
        htmlTemplate: en.html,
        textTemplate: en.text,
        status: "draft",
      },
      include: {
        promotion: true,
      },
    });

    return campaign;
  } catch (error) {
    console.error("Error creating appointment promotion email campaign:", error);
    throw new Error("Failed to create appointment promotion email campaign");
  }
}

/**
 * Gets scheduled campaigns that should be sent now
 */
export async function getScheduledCampaignsToSend(): Promise<PromotionEmailCampaign[]> {
  try {
    const now = new Date();
    
    const campaigns = await prisma.promotionEmailCampaign.findMany({
      where: {
        status: "scheduled",
        scheduledFor: {
          lte: now,
        },
      },
      include: {
        promotion: true,
      },
    });

    return campaigns;
  } catch (error) {
    console.error("Error getting scheduled campaigns:", error);
    throw new Error("Failed to get scheduled campaigns");
  }
}

/**
 * Processes scheduled campaigns that are due to be sent
 */
export async function processScheduledCampaigns(): Promise<{
  processed: number;
  success: number;
  failed: number;
}> {
  try {
    const campaigns = await getScheduledCampaignsToSend();
    
    if (campaigns.length === 0) {
      return { processed: 0, success: 0, failed: 0 };
    }
    
    let success = 0;
    let failed = 0;
    
    for (const campaign of campaigns) {
      try {
        await sendPromotionCampaign(campaign.id);
        success++;
      } catch (error) {
        console.error(`Failed to send campaign ${campaign.id}:`, error);
        failed++;
      }
    }
    
    return {
      processed: campaigns.length,
      success,
      failed,
    };
  } catch (error) {
    console.error("Error processing scheduled campaigns:", error);
    throw new Error("Failed to process scheduled campaigns");
  }
}

/**
 * Updates open and click counts for a campaign
 */
export async function trackCampaignInteraction(
  campaignId: string,
  interactionType: "open" | "click"
): Promise<void> {
  try {
    const updateData = interactionType === "open" 
      ? { openCount: { increment: 1 } }
      : { clickCount: { increment: 1 } };
    
    await prisma.promotionEmailCampaign.update({
      where: { id: campaignId },
      data: updateData,
    });
  } catch (error) {
    console.error(`Error tracking campaign ${interactionType} for ${campaignId}:`, error);
    // Don't throw, just log - tracking shouldn't break the application
  }
}
