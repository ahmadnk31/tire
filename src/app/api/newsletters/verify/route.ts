import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/aws-ses";
import {
  getSubscriptionConfirmationHtml,
  getSubscriptionConfirmationText,
} from "@/lib/email/newsletter-templates";

export async function GET(request: Request) {
  try {
    // Get verification token from URL
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    // Validate token
    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Find subscriber with this token
    const subscriber = await prisma.subscriber.findFirst({
      where: {
        verificationToken: token,
        verificationExpires: { gt: new Date() }, // Token must not be expired
      },
    });

    if (!subscriber) {
      return NextResponse.json(
        {
          error:
            "Invalid or expired verification token. Please request a new subscription.",
        },
        { status: 400 }
      );
    }

    // Update subscriber to verified status
    const updatedSubscriber = await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: {
        verified: true,
        subscribed: true,
        verificationToken: null,
        verificationExpires: null,
        lastActive: new Date(),
      },
    });

    // Generate unsubscribe token/URL for welcome email
    const unsubscribeToken = Buffer.from(
      `${updatedSubscriber.id}:${updatedSubscriber.email}`
    ).toString("base64");
    const unsubscribeUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/newsletter/unsubscribe?token=${unsubscribeToken}`;

    // Send welcome/confirmation email
    await sendEmail({
      to: updatedSubscriber.email,
      subject: "Welcome to Our Newsletter!",
      htmlBody: getSubscriptionConfirmationHtml({
        name: updatedSubscriber.name || "",
        unsubscribeUrl,
        siteUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        siteName: process.env.SITE_NAME || "Tire Shop",
      }),
      textBody: getSubscriptionConfirmationText({
        name: updatedSubscriber.name || "",
        unsubscribeUrl,
        siteUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        siteName: process.env.SITE_NAME || "Tire Shop",
      }),
    });

    // Redirect to success page with success message
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/newsletter/verification-success`,
      },
    });
  } catch (error) {
    console.error("Newsletter verification error:", error);

    return NextResponse.json(
      { error: "Failed to verify subscription" },
      { status: 500 }
    );
  }
}
