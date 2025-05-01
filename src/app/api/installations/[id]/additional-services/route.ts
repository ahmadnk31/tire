import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';

// Type for route parameters
type Params = {
  params: {
    id: string
  }
}

// Request validation schema
const additionalServiceSchema = z.object({
  serviceName: z.string().min(1, "Service name is required"),
  price: z.number().min(0, "Price must be a non-negative number"),
});

const additionalServicesArraySchema = z.array(additionalServiceSchema);

/**
 * GET /api/installations/[id]/additional-services
 * Get all additional services for a specific installation
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    // Find installation first to check permissions
    const installation = await prisma.installation.findUnique({
      where: { id },
    });
    
    if (!installation) {
      return NextResponse.json(
        { error: 'Installation not found' },
        { status: 404 }
      );
    }
    
    // Only allow access if admin/retailer or if user owns the installation
    const isAuthorized = 
      session.user.role === 'ADMIN' || 
      session.user.role === 'RETAILER' ||
      (installation.userId && installation.userId === session.user.id);
      
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Get additional services
    const additionalServices = await prisma.installationAdditionalService.findMany({
      where: { installationId: id },
      orderBy: { createdAt: 'asc' }
    });
    
    return NextResponse.json(additionalServices);
    
  } catch (error) {
    console.error('Error fetching installation additional services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch installation additional services' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/installations/[id]/additional-services
 * Add a new additional service to an installation
 */
export async function POST(request: NextRequest, { params }: Params) {
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
    
    const { id } = params;
    
    // Check if installation exists
    const installation = await prisma.installation.findUnique({
      where: { id },
    });
    
    if (!installation) {
      return NextResponse.json(
        { error: 'Installation not found' },
        { status: 404 }
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
    
    // Check if service already exists for this installation
    const existingService = await prisma.installationAdditionalService.findFirst({
      where: {
        installationId: id,
        serviceName: validatedData.data.serviceName
      }
    });
    
    if (existingService) {
      return NextResponse.json(
        { error: 'Service name already exists for this installation' },
        { status: 400 }
      );
    }
    
    // Create new additional service
    const additionalService = await prisma.installationAdditionalService.create({
      data: {
        installationId: id,
        serviceName: validatedData.data.serviceName,
        price: validatedData.data.price
      }
    });
    
    // Update installation total price
    await updateInstallationTotalPrice(id);
    
    return NextResponse.json(additionalService, { status: 201 });
    
  } catch (error) {
    console.error('Error adding installation additional service:', error);
    return NextResponse.json(
      { error: 'Failed to add installation additional service' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/installations/[id]/additional-services
 * Update all additional services for a specific installation (bulk update)
 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only admin or retailer can update services
    if (session.user.role !== 'ADMIN' && session.user.role !== 'RETAILER') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin or retailer access required.' },
        { status: 403 }
      );
    }
    
    const { id } = params;
    
    // Check if installation exists
    const installation = await prisma.installation.findUnique({
      where: { id },
    });
    
    if (!installation) {
      return NextResponse.json(
        { error: 'Installation not found' },
        { status: 404 }
      );
    }
    
    // Validate request body
    const body = await request.json();
    const validatedData = additionalServicesArraySchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validatedData.error.format() },
        { status: 400 }
      );
    }
    
    // Delete all existing services
    await prisma.installationAdditionalService.deleteMany({
      where: { installationId: id }
    });
    
    // Create all new services
    const additionalServices = await prisma.installationAdditionalService.createMany({
      data: validatedData.data.map(service => ({
        installationId: id,
        serviceName: service.serviceName,
        price: service.price
      }))
    });
    
    // Update installation total price
    await updateInstallationTotalPrice(id);
    
    // Return the new services
    const updatedServices = await prisma.installationAdditionalService.findMany({
      where: { installationId: id }
    });
    
    return NextResponse.json(updatedServices);
    
  } catch (error) {
    console.error('Error updating installation additional services:', error);
    return NextResponse.json(
      { error: 'Failed to update installation additional services' },
      { status: 500 }
    );
  }
}

// Helper function to update the total price of an installation
async function updateInstallationTotalPrice(installationId: string) {
  try {
    // Get the installation with its base price
    const installation = await prisma.installation.findUnique({
      where: { id: installationId },
      select: { basePrice: true }
    });
    
    if (!installation) return;
    
    // Get all additional services
    const additionalServices = await prisma.installationAdditionalService.findMany({
      where: { installationId }
    });
    
    // Calculate the total price
    const basePrice = installation.basePrice || 0;
    const additionalServicesTotal = additionalServices.reduce(
      (sum, service) => sum + service.price, 0
    );
    
    const totalPrice = basePrice + additionalServicesTotal;
    
    // Update the installation with the new total price
    await prisma.installation.update({
      where: { id: installationId },
      data: { totalPrice }
    });
    
  } catch (error) {
    console.error('Error updating installation total price:', error);
  }
}
