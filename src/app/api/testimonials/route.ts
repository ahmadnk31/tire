import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';

// Testimonial creation/update schema
const testimonialSchema = z.object({
  customerTitle: z.string().optional(),
  content: z.string().min(10, { message: "Testimonial must be at least 10 characters" }).max(1000, { message: "Testimonial cannot exceed 1000 characters" }),
  rating: z.number().min(1).max(5),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "FEATURED"]).default("PENDING"),
  adminNotes: z.string().optional(),
  userId: z.string().optional(), // Optional for admin creation, but will use session user ID if not provided
});

// GET all testimonials (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized. Only admin and staff can access testimonials.' },
        { status: 401 }
      );
    }

    // Retrieve all testimonials
    const testimonials = await prisma.testimonial.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ testimonials });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch testimonials' },
      { status: 500 }
    );
  }
}

// POST to create a new testimonial (admin or authorized user)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to submit a testimonial.' },
        { status: 401 }
      );
    }

    // Parse and validate the request body
    const body = await request.json();
    const validationResult = testimonialSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid testimonial data', details: validationResult.error.format() },
        { status: 400 }
      );
    }    const { customerTitle, content, rating, status, adminNotes, userId } = validationResult.data;
    
    // Only admins can set status directly - for regular users, always set to PENDING
    const finalStatus = session.user.role === 'ADMIN' 
      ? status
      : 'PENDING';
    
    // Set isVisible based on status
    const isVisible = finalStatus === 'APPROVED' || finalStatus === 'FEATURED';

    // Create the testimonial
    const testimonial = await prisma.testimonial.create({
      data: {
        customerTitle: customerTitle || null,
        content,
        rating,
        status: finalStatus,
        isVisible,
        adminNotes: adminNotes || null,
        userId: userId || session.user.id,
        reviewedBy: finalStatus !== 'PENDING' ? session.user.id : null,
        reviewedAt: finalStatus !== 'PENDING' ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Testimonial created successfully',
      testimonial,
    });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    return NextResponse.json(
      { error: 'Failed to create testimonial' },
      { status: 500 }
    );
  }
}
