import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email/aws-ses';
import { 
  getUnsubscribeConfirmationHtml, 
  getUnsubscribeConfirmationText 
} from '@/lib/email/newsletter-templates';

export async function GET(request: Request) {
  try {
    // Get unsubscribe token from URL
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    
    // Validate token
    if (!token) {
      return NextResponse.json(
        { error: 'Unsubscribe token is required' },
        { status: 400 }
      );
    }
    
    // Decode the token to get subscriber info
    try {
      const decodedData = Buffer.from(token, 'base64').toString();
      const [subscriberId, subscriberEmail] = decodedData.split(':');
      
      if (!subscriberId || !subscriberEmail) {
        return NextResponse.json(
          { error: 'Invalid unsubscribe token' },
          { status: 400 }
        );
      }
      
      // Find the subscriber
      const subscriber = await prisma.subscriber.findFirst({
        where: { 
          id: subscriberId,
          email: subscriberEmail
        }
      });
      
      if (!subscriber) {
        return NextResponse.json(
          { error: 'Subscriber not found' },
          { status: 404 }
        );
      }
      
      // Update subscriber to unsubscribed status
      const updatedSubscriber = await prisma.subscriber.update({
        where: { id: subscriber.id },
        data: {
          subscribed: false,
          unsubscribedAt: new Date(),
          lastActive: new Date()
        }
      });
      
      // Send unsubscribe confirmation email
      await sendEmail({
        to: updatedSubscriber.email,
        subject: 'You have been unsubscribed',
        htmlBody: getUnsubscribeConfirmationHtml({
          name: updatedSubscriber.name || '',
          siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          siteName: process.env.SITE_NAME || 'Tire Shop',
        }),
        textBody: getUnsubscribeConfirmationText({
          name: updatedSubscriber.name || '',
          siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          siteName: process.env.SITE_NAME || 'Tire Shop',
        }),
      });
      
      // Redirect to success page
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/newsletter/unsubscribe-success`,
        },
      });
      
    } catch (error) {
      console.error('Error decoding unsubscribe token:', error);
      return NextResponse.json(
        { error: 'Invalid unsubscribe token format' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    
    return NextResponse.json(
      { error: 'Failed to process unsubscribe request' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Find subscriber by email
    const subscriber = await prisma.subscriber.findUnique({
      where: { email },
    });
    
    if (!subscriber) {
      return NextResponse.json(
        { message: 'Email not found in our subscribers list' },
        { status: 404 }
      );
    }
    
    // Only update if currently subscribed
    if (subscriber.subscribed) {
      // Update subscriber status
      await prisma.subscriber.update({
        where: { id: subscriber.id },
        data: {
          subscribed: false,
          unsubscribedAt: new Date(),
        },
      });
      
      // Send confirmation email
      await sendEmail({
        to: email,
        subject: 'Unsubscribe Confirmation',
        htmlBody: getUnsubscribeConfirmationHtml({
          name: subscriber.name || '',
          siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          siteName: process.env.SITE_NAME || 'Tire Shop',
        }),
        textBody: getUnsubscribeConfirmationText({
          name: subscriber.name || '',
          siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          siteName: process.env.SITE_NAME || 'Tire Shop',
        }),
      });
    }
    
    return NextResponse.json(
      { message: 'Successfully unsubscribed from newsletter' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe from newsletter' },
      { status: 500 }
    );
  }
}
