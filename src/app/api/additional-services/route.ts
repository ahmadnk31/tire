import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';

// Request validation schema
const additionalServiceSchema = z.object({
  serviceName: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be a non-negative number"),
});

/**
 * GET /api/additional-services
 * Get all available additional services
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // No authentication required for viewing available services
    
    // Get all additional services
    const additionalServices = await prisma.installationAdditionalService.findMany({
      orderBy: { createdAt: 'asc' }
    });
    
    return NextResponse.json(additionalServices);
    
  } catch (error) {
    console.error('Error fetching additional services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch additional services' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/additional-services
 * Create a new additional service
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only admin or retailer can add services
    if (session.user.role !== 'ADMIN' && session.user.role !== 'RETAILER') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin or retailer access required.' },
        { status: 403 }
      );
    }
    
    // Validate request body
    const body = await request.json();
    const validatedData = additionalServiceSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validatedData.error.format() },
        { status: 400 }
      );
    }
    
    // Check if service already exists
    const existingService = await prisma.installationAdditionalService.findFirst({
      where: {
        serviceName: validatedData.data.serviceName
      }
    });
    
    if (existingService) {
      return NextResponse.json(
        { error: 'Service name already exists' },
        { status: 400 }
      );
    }
    
    // Create new additional service
    const additionalService = await prisma.installationAdditionalService.create({
      data: {
        serviceName: validatedData.data.serviceName,
        description: validatedData.data.description || '',
        price: validatedData.data.price
      }
    });
    
    return NextResponse.json(additionalService, { status: 201 });
    
  } catch (error) {
    console.error('Error creating additional service:', error);
    return NextResponse.json(
      { error: 'Failed to create additional service' },
      { status: 500 }
    );
  }
}
