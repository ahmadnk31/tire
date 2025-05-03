import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/aws-ses";
import {
  getSubscriptionConfirmationHtml,
  getSubscriptionConfirmationText,
  getVerificationEmailHtml,
  getVerificationEmailText,
} from "@/lib/email/newsletter-templates";
import { createHash } from "crypto";
import { getIpAddress, validateCsrfToken } from "@/lib/security";
import { rateLimit } from "@/lib/rate-limit";

// Validation schema
const subscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
  source: z.string().optional().default("website"),
  preferences: z.array(z.string()).optional().default([]),
  csrfToken: z.string().min(1, "CSRF token is required"),
});

// Rate limit configuration - 5 requests per IP in 10 minutes
const limiter = rateLimit({
  interval: 10 * 60 * 1000, // 10 minutes
  uniqueTokenPerInterval: 500,
  limit: 5,
});

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const ip = getIpAddress(request);

    // Apply rate limiting
    try {
      await limiter.check(ip);
    } catch {
      console.log(`Rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { error: "Too many subscription attempts. Please try again later." },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = subscribeSchema.parse(body);
    const { email, name, source, preferences, csrfToken } = validatedData;

    // Validate CSRF token
    const csrfValid = await validateCsrfToken(csrfToken);
    if (!csrfValid) {
      console.warn(`Invalid CSRF token attempt for email: ${email}`);
      return NextResponse.json({ error: "Invalid request" }, { status: 403 });
    }

    // Check if subscriber already exists
    const existingSubscriber = await prisma.subscriber.findUnique({
      where: { email },
      include: { preferences: true },
    });

    let subscriber;
    let isNewSubscription = false;

    if (existingSubscriber) {
      // If they exist but are unsubscribed, require reverification
      if (!existingSubscriber.subscribed) {
        subscriber = await prisma.subscriber.update({
          where: { id: existingSubscriber.id },
          data: {
            // Don't set subscribed to true yet - require verification
            verificationToken: createHash("sha256")
              .update(`${email}:${Date.now()}`)
              .digest("hex"),
            verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            lastActive: new Date(),
            name: name || existingSubscriber.name,
          },
          include: { preferences: true },
        });
        isNewSubscription = true;
      } else if (existingSubscriber.verified) {
        // Already subscribed and verified

        // Update preferences if needed
        if (preferences.length > 0) {
          const currentPrefs = existingSubscriber.preferences.map(
            (p) => p.name
          );

          // Add new preferences
          const newPrefs = preferences.filter((p) => !currentPrefs.includes(p));
          if (newPrefs.length > 0) {
            await prisma.subscriberPreference.createMany({
              data: newPrefs.map((name) => ({
                subscriberId: existingSubscriber.id,
                name,
              })),
            });
          }

          // Update last active timestamp
          await prisma.subscriber.update({
            where: { id: existingSubscriber.id },
            data: { lastActive: new Date() },
          });
        }

        return NextResponse.json(
          { message: "You are already subscribed to our newsletter" },
          { status: 200 }
        );
      } else {
        // Exists but not verified - resend verification
        subscriber = await prisma.subscriber.update({
          where: { id: existingSubscriber.id },
          data: {
            verificationToken: createHash("sha256")
              .update(`${email}:${Date.now()}`)
              .digest("hex"),
            verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            lastActive: new Date(),
          },
          include: { preferences: true },
        });
        isNewSubscription = true;
      }
    } else {
      // Create new subscriber - unverified initially
      const verificationToken = createHash("sha256")
        .update(`${email}:${Date.now()}`)
        .digest("hex");

      subscriber = await prisma.subscriber.create({
        data: {
          email,
          name,
          source,
          subscribed: false, // Start as false until verified
          verified: false,
          verificationToken,
          verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          preferences: {
            create: preferences.map((name) => ({
              name,
            })),
          },
        },
        include: { preferences: true },
      });
      isNewSubscription = true;
    }

    // Log subscription attempt
    console.log(
      `Newsletter subscription attempt: ${email}, source: ${source}, new: ${isNewSubscription}`
    );

    if (isNewSubscription) {
      // Send verification email (double opt-in)
      const verificationUrl = `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/newsletter/verify?token=${subscriber.verificationToken}`;

      await sendEmail({
        to: email,
        subject: "Verify Your Newsletter Subscription",
        htmlBody: getVerificationEmailHtml({
          name: name || "",
          verificationUrl,
          siteUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          siteName: process.env.SITE_NAME || "Tire Shop",
          expiryHours: 24,
        }),
        textBody: getVerificationEmailText({
          name: name || "",
          verificationUrl,
          siteUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          siteName: process.env.SITE_NAME || "Tire Shop",
          expiryHours: 24,
        }),
      });

      return NextResponse.json(
        {
          message: "Please check your email to verify your subscription",
          subscriberId: subscriber.id,
          verified: false,
        },
        { status: 200 }
      );
    } else {
      // Generate unsubscribe token/URL
      const unsubscribeToken = Buffer.from(
        `${subscriber.id}:${subscriber.email}`
      ).toString("base64");
      const unsubscribeUrl = `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/newsletter/unsubscribe?token=${unsubscribeToken}`;

      // Send confirmation email
      await sendEmail({
        to: email,
        subject: "Welcome to Our Newsletter!",
        htmlBody: getSubscriptionConfirmationHtml({
          name: name || "",
          unsubscribeUrl,
          siteUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          siteName: process.env.SITE_NAME || "Tire Shop",
        }),
        textBody: getSubscriptionConfirmationText({
          name: name || "",
          unsubscribeUrl,
          siteUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          siteName: process.env.SITE_NAME || "Tire Shop",
        }),
      });

      return NextResponse.json(
        {
          message: "Successfully subscribed to newsletter",
          subscriberId: subscriber.id,
          verified: true,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Newsletter subscription error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid subscription data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to subscribe to newsletter" },
      { status: 500 }
    );
  }
}
