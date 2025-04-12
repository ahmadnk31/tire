import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/aws/ses-utils';

export async function GET(request: NextRequest) {
  try {
    // Get the token from the URL query parameters
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    // Check if token exists
    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }
    
    // Find the verification token in the database
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });
    
    // If no token found or token has expired
    if (!verificationToken || verificationToken.expires < new Date()) {
      // If token exists but has expired, delete it
      if (verificationToken) {
        await prisma.verificationToken.delete({
          where: { id: verificationToken.id },
        });
      }
      
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }
    
    // Find the user by email (identifier)
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update the user to mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
    
    // Delete the used verification token
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });
    
    // Send welcome email now that the account is verified
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue with verification even if welcome email fails
    }
    
    return NextResponse.json(
      { 
        success: true,
        message: 'Email verified successfully' 
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Email verification failed' },
      { status: 500 }
    );
  }
}