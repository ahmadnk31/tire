import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email/aws-ses';
import { 
  getSubscriptionConfirmationHtml, 
  getSubscriptionConfirmationText 
} from '@/lib/email/newsletter-templates';

// Validation schema
const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
  source: z.string().optional().default('website'),
});

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = subscribeSchema.parse(body);
    const { email, name, source } = validatedData;
    
    // Check if subscriber already exists
    const existingSubscriber = await prisma.subscriber.findUnique({
      where: { email },
    });
    
    let subscriber;
    
    if (existingSubscriber) {
      // If they exist but are unsubscribed, resubscribe them
      if (!existingSubscriber.subscribed) {
        subscriber = await prisma.subscriber.update({
          where: { id: existingSubscriber.id },
          data: {
            subscribed: true,
            unsubscribedAt: null,
            lastActive: new Date(),
            name: name || existingSubscriber.name,
          },
        });
      } else {
        // Already subscribed
        return NextResponse.json(
          { message: 'You are already subscribed to our newsletter' },
          { status: 200 }
        );
      }
    } else {
      // Create new subscriber
      subscriber = await prisma.subscriber.create({
        data: {
          email,
          name,
          source,
          subscribed: true,
        },
      });
    }
    
    // Generate unsubscribe token/URL
    const unsubscribeToken = Buffer.from(`${subscriber.id}:${subscriber.email}`).toString('base64');
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/newsletter/unsubscribe?token=${unsubscribeToken}`;
    
    // Send confirmation email
    await sendEmail({
      to: email,
      subject: 'Welcome to Our Newsletter!',
      htmlBody: getSubscriptionConfirmationHtml({
        name: name || '',
        unsubscribeUrl,
        siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        siteName: process.env.SITE_NAME || 'Tire Shop',
      }),
      textBody: getSubscriptionConfirmationText({
        name: name || '',
        unsubscribeUrl,
        siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        siteName: process.env.SITE_NAME || 'Tire Shop',
      }),
    });
    
    return NextResponse.json(
      { 
        message: 'Successfully subscribed to newsletter',
        subscriberId: subscriber.id 
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid subscription data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to subscribe to newsletter' },
      { status: 500 }
    );
  }
}
