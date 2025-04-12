import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';

// Testimonial update schema
const testimonialUpdateSchema = z.object({
  customerTitle: z.string().optional(),
  content: z.string().min(10, { message: "Testimonial must be at least 10 characters" }).max(1000, { message: "Testimonial cannot exceed 1000 characters" }).optional(),
  rating: z.number().min(1).max(5).optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "FEATURED"]).optional(),
  adminNotes: z.string().optional(),
});

// GET a single testimonial by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }    const testimonialId = params.id;

    // Build query based on user role
    // Admin/Staff can see all testimonials, regular users can only see their own or approved ones
    const isAdmin = session.user.role === 'ADMIN'
    
    const testimonial = await prisma.testimonial.findFirst({
      where: {
        id: testimonialId,
        ...(isAdmin ? {} : {
          OR: [
            { userId: session.user.id },
            { isVisible: true }
          ]
        })
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

    if (!testimonial) {
      return NextResponse.json(
        { error: 'Testimonial not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ testimonial });
  } catch (error) {
    console.error('Error fetching testimonial:', error);
    return NextResponse.json(
      { error: 'Failed to fetch testimonial' },
      { status: 500 }
    );
  }
}

// PUT to update a testimonial (admin or original author)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const testimonialId = params.id;
    const isAdmin = session.user.role === 'ADMIN';

    // Get the existing testimonial
    const existingTestimonial = await prisma.testimonial.findUnique({
      where: { id: testimonialId },
    });

    if (!existingTestimonial) {
      return NextResponse.json(
        { error: 'Testimonial not found' },
        { status: 404 }
      );
    }

    // Check permissions: only admins or the original author can update
    if (!isAdmin && existingTestimonial.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Permission denied. You can only update your own testimonials.' },
        { status: 403 }
      );
    }

    // Parse and validate the request body
    const body = await request.json();
    const validationResult = testimonialUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid testimonial data', details: validationResult.error.format() },
        { status: 400 }
      );
    }    const { customerTitle, content, rating, status, adminNotes } = validationResult.data;

    // Regular users can't update status; admins can
    const finalStatus = isAdmin && status ? status : existingTestimonial.status;
    
    // Set isVisible based on status
    const isVisible = finalStatus === 'APPROVED' || finalStatus === 'FEATURED';

    // Update the testimonial
    const updatedTestimonial = await prisma.testimonial.update({
      where: { id: testimonialId },
      data: {
        customerTitle: customerTitle !== undefined ? customerTitle : existingTestimonial.customerTitle,
        ...(content && { content }),
        ...(rating && { rating }),
        status: finalStatus,
        isVisible,
        adminNotes: adminNotes !== undefined ? adminNotes : existingTestimonial.adminNotes,
        // If status changed and user is admin, update review info
        ...(isAdmin && status && status !== existingTestimonial.status ? {
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
        } : {}),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Testimonial updated successfully',
      testimonial: updatedTestimonial,
    });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    return NextResponse.json(
      { error: 'Failed to update testimonial' },
      { status: 500 }
    );
  }
}

// DELETE a testimonial (admin or original author)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const testimonialId = params.id;
    const isAdmin = session.user.role === 'ADMIN' ;

    // Get the existing testimonial
    const existingTestimonial = await prisma.testimonial.findUnique({
      where: { id: testimonialId },
    });

    if (!existingTestimonial) {
      return NextResponse.json(
        { error: 'Testimonial not found' },
        { status: 404 }
      );
    }

    // Check permissions: only admins or the original author can delete
    if (!isAdmin && existingTestimonial.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Permission denied. You can only delete your own testimonials.' },
        { status: 403 }
      );
    }

    // Delete the testimonial
    await prisma.testimonial.delete({
      where: { id: testimonialId },
    });

    return NextResponse.json({
      success: true,
      message: 'Testimonial deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    return NextResponse.json(
      { error: 'Failed to delete testimonial' },
      { status: 500 }
    );
  }
}
