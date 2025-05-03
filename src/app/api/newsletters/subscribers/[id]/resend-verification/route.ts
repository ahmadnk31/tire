import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/aws-ses";
import {
  getVerificationEmailHtml,
  getVerificationEmailText,
} from "@/lib/email/newsletter-templates";
import { generateVerificationToken } from "@/lib/utils";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    // Find the subscriber
    const subscriber = await prisma.subscriber.findUnique({
      where: { id },
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: "Subscriber not found" },
        { status: 404 }
      );
    }

    // Already verified?
    if (subscriber.verified) {
      return NextResponse.json(
        { message: "Subscriber is already verified" },
        { status: 400 }
      );
    }

    // Generate new verification token (valid for 48 hours)
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 48);

    // Update subscriber with new verification token
    const updatedSubscriber = await prisma.subscriber.update({
      where: { id },
      data: {
        verificationToken,
        verificationExpires,
        lastActive: new Date(),
      },
    });

    // Create verification URL
    const verificationUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/api/newsletters/verify?token=${verificationToken}`;

    // Send verification email
    await sendEmail({
      to: subscriber.email,
      subject: "Verify Your Newsletter Subscription",
      htmlBody: getVerificationEmailHtml({
        name: subscriber.name || "",
        verificationUrl,
        expiryHours: 48,
        siteUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        siteName: process.env.SITE_NAME || "Tire Shop",
      }),
      textBody: getVerificationEmailText({
        name: subscriber.name || "",
        verificationUrl,
        expiryHours: 48,
        siteUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        siteName: process.env.SITE_NAME || "Tire Shop",
      }),
    });

    return NextResponse.json(
      {
        message: "Verification email resent successfully",
        email: subscriber.email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resending verification email:", error);
    return NextResponse.json(
      { error: "Failed to resend verification email" },
      { status: 500 }
    );
  }
}
