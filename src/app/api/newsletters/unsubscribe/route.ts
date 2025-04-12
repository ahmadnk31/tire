import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email/aws-ses';
import { 
  getUnsubscribeConfirmationHtml, 
  getUnsubscribeConfirmationText 
} from '@/lib/email/newsletter-templates';

export async function GET(request: NextRequest) {
  try {
    // Get token from query params
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/newsletter/unsubscribe?error=missing-token`
      );
    }
    
    // Decode token to get subscriber ID and email
    let subscriberId: string;
    let email: string;
    
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      [subscriberId, email] = decoded.split(':');
    } catch (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/newsletter/unsubscribe?error=invalid-token`
      );
    }
    
    // Find subscriber in database
    const subscriber = await prisma.subscriber.findUnique({
      where: { id: subscriberId },
    });
    
    if (!subscriber || subscriber.email !== email) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/newsletter/unsubscribe?error=subscriber-not-found`
      );
    }
    
    // Update subscriber status
    await prisma.subscriber.update({
      where: { id: subscriberId },
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
    
    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/newsletter/unsubscribe?success=true`
    );
    
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/newsletter/unsubscribe?error=server-error`
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
