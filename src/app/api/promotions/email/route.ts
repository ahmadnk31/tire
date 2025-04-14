import { NextResponse } from "next/server";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { prisma } from "@/lib/db";

// AWS SES configuration
const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// Function to send promotional emails to users who opted in
export async function POST(request: Request) {
  try {
    const { promotionId } = await request.json();

    if (!promotionId) {
      return NextResponse.json(
        { error: "Promotion ID is required" },
        { status: 400 }
      );
    }

    // Fetch the promotion details
    const promotion = await prisma.promotion.findUnique({
      where: {
        id: promotionId,
      },
    });

    if (!promotion) {
      return NextResponse.json(
        { error: "Promotion not found" },
        { status: 404 }
      );
    }

    // Fetch users who opted in for promotional emails
    const users = await prisma.user.findMany({
      where: {
        notificationPreferences:{
            promotionalEmails: true,
        }
      },
      select: {
        email: true,
        name: true,
      },
    });

    // If no users have opted in, return early
    if (users.length === 0) {
      return NextResponse.json({
        message: "No users have opted in for promotional emails",
      });
    }

    // Prepare the email content
    const subject = `New Deal Alert: ${promotion.title}`;
    
    // Track email sending promises
    const emailPromises = users.map(async (user) => {
      const emailParams = {
        Source: process.env.EMAIL_FROM || "noreply@yourdomain.com",
        Destination: {
          ToAddresses: [user.email],
        },
        Message: {
          Subject: {
            Data: subject,
          },
          Body: {
            Html: {
              Data: `
                <html>
                  <head>
                    <style>
                      body { font-family: Arial, sans-serif; line-height: 1.6; }
                      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                      .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
                      .content { padding: 20px; }
                      .promotion { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; }
                      .button { background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; display: inline-block; border-radius: 5px; }
                      .footer { font-size: 12px; text-align: center; margin-top: 30px; color: #666; }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <div class="header">
                        <h1>New Deal Alert!</h1>
                      </div>
                      <div class="content">
                        <p>Hello ${user.name || "there"},</p>
                        <p>We're excited to share a new promotion with you:</p>
                        <div class="promotion">
                          <h2>${promotion.title}</h2>
                          <p>${promotion.description}</p>
                          ${promotion.endDate 
                            ? `<p>Valid until: ${new Date(promotion.endDate).toLocaleDateString()}</p>` 
                            : ""
                          }
                        </div>
                        <p>Don't miss out on this amazing offer!</p>
                        <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/deals" class="button">View Deal</a>
                      </div>
                      <div class="footer">
                        <p>You're receiving this email because you signed up for promotional emails from us.</p>
                        <p>To unsubscribe, <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/account/settings">update your preferences</a>.</p>
                      </div>
                    </div>
                  </body>
                </html>
              `,
            },
            Text: {
              Data: `
                New Deal Alert: ${promotion.title}
                
                Hello ${user.name || "there"},
                
                We're excited to share a new promotion with you:
                
                ${promotion.title}
                ${promotion.description}
                ${promotion.endDate ? `Valid until: ${new Date(promotion.endDate).toLocaleDateString()}` : ""}
                
                Don't miss out on this amazing offer!
                
                View Deal: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/deals
                
                You're receiving this email because you signed up for promotional emails from us.
                To unsubscribe, update your preferences at ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/account/settings
              `,
            },
          },
        },
      };

      try {
        const sendEmailCommand = new SendEmailCommand(emailParams);
        await sesClient.send(sendEmailCommand);
        return { email: user.email, status: "sent" };
      } catch (error) {
        console.error(`Failed to send email to ${user.email}:`, error);
        return { email: user.email, status: "failed", error };
      }
    });

    // Wait for all emails to be sent
    const results = await Promise.all(emailPromises);
    
    const sentCount = results.filter(r => r.status === "sent").length;
    const failedCount = results.filter(r => r.status === "failed").length;

    return NextResponse.json({
      message: `Promotional emails processed: ${sentCount} sent, ${failedCount} failed`,
      sentCount,
      failedCount,
    });
  } catch (error) {
    console.error("Error sending promotional emails:", error);
    return NextResponse.json(
      { error: "Failed to send promotional emails" },
      { status: 500 }
    );
  }
}
