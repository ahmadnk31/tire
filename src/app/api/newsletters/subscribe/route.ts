import { NextRequest, NextResponse } from "next/server";
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
import { v4 as uuidv4 } from "uuid";

// Validation schema
const subscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
  source: z.string().optional(),
  preferredLanguage: z.string().optional().default("en"),
  groupIds: z.array(z.string()).optional(),
  csrfToken: z.string().min(1, "CSRF token is required"),
});

// Rate limit configuration - 5 requests per IP in 10 minutes
const limiter = rateLimit({
  interval: 10 * 60 * 1000, // 10 minutes
  uniqueTokenPerInterval: 500,
  limit: 5,
});

export async function POST(request: NextRequest) {
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

    // Get the user's locale from the Accept-Language header
    const acceptLanguage = request.headers.get("Accept-Language") || "";
    // Simple language detection (in reality you'd use a more robust solution)
    const detectedLocale = acceptLanguage.includes("nl") ? "nl" : "en";
    
    // Parse and validate request body
    const body = await request.json();
    const { email, name, source, preferredLanguage = detectedLocale, groupIds = [], csrfToken } = subscribeSchema.parse(body);

    // Validate CSRF token
    const csrfValid = await validateCsrfToken(csrfToken);
    if (!csrfValid) {
      console.warn(`Invalid CSRF token attempt for email: ${email}`);
      return NextResponse.json({ error: "Invalid request" }, { status: 403 });
    }

    // Check if subscriber already exists
    let subscriber = await prisma.subscriber.findUnique({
      where: { email },
      include: {
        groups: true,
      },
    });

    let isNewSubscription = false;

    if (subscriber) {
      // Existing subscriber
      if (subscriber.unsubscribedAt) {
        // Previously unsubscribed, so resubscribe them
        subscriber = await prisma.subscriber.update({
          where: { id: subscriber.id },
          data: {
            subscribed: true,
            unsubscribedAt: null,
            verifiedAt: new Date(), // They were verified before
            updatedAt: new Date(),
            preferredLanguage, // Update preferred language
          },
          include: {
            groups: true,
          },
        });
      } else if (!subscriber.verified) {
        // Resend verification email for unverified subscribers
        isNewSubscription = true;

        subscriber = await prisma.subscriber.update({
          where: { id: subscriber.id },
          data: {
            name: name || subscriber.name,
            source: source || subscriber.source,
            verificationToken: uuidv4(),
            verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            updatedAt: new Date(),
            preferredLanguage, // Update preferred language
          },
          include: {
            groups: true,
          },
        });
      } else {
        // Already subscribed and verified, just update their info
        subscriber = await prisma.subscriber.update({
          where: { id: subscriber.id },
          data: {
            name: name || subscriber.name,
            source: source || subscriber.source,
            updatedAt: new Date(),
            preferredLanguage, // Update preferred language
          },
          include: {
            groups: true,
          },
        });
      }

      // Add to any new groups
      if (groupIds.length > 0) {
        const existingGroupIds = subscriber.groups.map((g) => g.id);
        const newGroupIds = groupIds.filter((id) => !existingGroupIds.includes(id));

        if (newGroupIds.length > 0) {
          await prisma.subscriber.update({
            where: { id: subscriber.id },
            data: {
              groups: {
                connect: newGroupIds.map((id) => ({ id })),
              },
            },
          });
        }
      }
    } else {
      // New subscriber
      isNewSubscription = true;

      // Create new subscriber record
      subscriber = await prisma.subscriber.create({
        data: {
          email,
          name: name || "",
          source: source || "website",
          subscribed: true,
          verified: false, // Needs email verification
          verificationToken: uuidv4(),
          verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          preferredLanguage, // Set preferred language
          groups: {
            connect: groupIds.map((id) => ({ id })),
          },
        },
        include: {
          groups: true,
        },
      });
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
        subject: preferredLanguage === "nl" ? "Verifieer Uw Nieuwsbrief Inschrijving" : "Verify Your Newsletter Subscription",
        htmlBody: getVerificationEmailHtml({
          name: name || "",
          verificationUrl,
          siteUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          siteName: process.env.SITE_NAME || "Tire Shop",
          expiryHours: 24,
          locale: preferredLanguage,
        }),
        textBody: getVerificationEmailText({
          name: name || "",
          verificationUrl,
          siteUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          siteName: process.env.SITE_NAME || "Tire Shop",
          expiryHours: 24,
          locale: preferredLanguage,
        }),
      });

      return NextResponse.json(
        {
          message: preferredLanguage === "nl" 
            ? "Controleer uw e-mail om uw inschrijving te verifiëren" 
            : "Please check your email to verify your subscription",
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
        subject: preferredLanguage === "nl" ? "Welkom bij Onze Nieuwsbrief!" : "Welcome to Our Newsletter!",
        htmlBody: getSubscriptionConfirmationHtml({
          name: name || "",
          unsubscribeUrl,
          siteUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          siteName: process.env.SITE_NAME || "Tire Shop",
          locale: preferredLanguage,
        }),
        textBody: getSubscriptionConfirmationText({
          name: name || "",
          unsubscribeUrl,
          siteUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          siteName: process.env.SITE_NAME || "Tire Shop",
          locale: preferredLanguage,
        }),
      });

      return NextResponse.json(
        {
          message: preferredLanguage === "nl" 
            ? "Succesvol ingeschreven voor de nieuwsbrief" 
            : "Successfully subscribed to newsletter",
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

