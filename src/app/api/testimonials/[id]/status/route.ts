import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';

// Status update schema
const statusUpdateSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'FEATURED']),
  adminNotes: z.string().optional(),
});

// PATCH to update testimonial status (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized. Only admin and staff can update testimonial status.' },
        { status: 401 }
      );
    }

    const testimonialId = params.id;
    
    // Parse and validate the request body
    const body = await request.json();
    const validationResult = statusUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid status update data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { status, adminNotes } = validationResult.data;
    
    // Set visibility based on the status
    const isVisible = status === 'APPROVED' || status === 'FEATURED';
    
    // Check if testimonial exists
    const existingTestimonial = await prisma.testimonial.findUnique({
      where: { id: testimonialId },
    });

    if (!existingTestimonial) {
      return NextResponse.json(
        { error: 'Testimonial not found' },
        { status: 404 }
      );
    }

    // Update the testimonial status
    const updatedTestimonial = await prisma.testimonial.update({
      where: { id: testimonialId },
      data: {
        status,
        isVisible,
        adminNotes: adminNotes !== undefined ? adminNotes : existingTestimonial.adminNotes,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Testimonial status updated to ${status}`,
      testimonial: updatedTestimonial,
    });
  } catch (error) {
    console.error('Error updating testimonial status:', error);
    return NextResponse.json(
      { error: 'Failed to update testimonial status' },
      { status: 500 }
    );
  }
}
