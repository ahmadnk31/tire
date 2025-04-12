import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { sendVerificationEmail } from '@/lib/aws/ses-utils';
import crypto from 'crypto';

// Registration request schema validation
const registerSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Function to generate a verification token
function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { name, email, password } = result.data;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    // Hash the password
    const hashedPassword = await hash(password, 12);
    
    // Create the user (without verified email)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        // Note: emailVerified is left null until verification
      },
    });
    
    // Generate a token with expiration (24 hours from now)
    const token = generateVerificationToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Store the verification token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });
    
    // Send verification email
    try {
      await sendVerificationEmail(email, name, token);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue with user creation even if email fails
    }
    
    // Return success without exposing sensitive user data
    return NextResponse.json(
      { 
        message: 'User registered successfully. Please check your email to verify your account.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}