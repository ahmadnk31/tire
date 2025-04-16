import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';
import { InstallationServiceType, InstallationStatus, PurchaseLocation } from '@prisma/client';

// GET all installations
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Make sure the user is an admin
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(request.url);
    
    // Get query parameters for filtering
    const status = url.searchParams.get('status');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    // Build the query
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (dateFrom || dateTo) {
      query.appointmentDate = {};
      if (dateFrom) {
        query.appointmentDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.appointmentDate.lte = new Date(dateTo);
      }
    }
    
    if (search) {
      query.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { vehicleMake: { contains: search, mode: 'insensitive' } },
        { vehicleModel: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Get total count for pagination
    const totalCount = await prisma.installation.count({ where: query });
    
    // Get the installations
    const installations = await prisma.installation.findMany({
      where: query,
      include: {
        additionalServices: true,
      },
      orderBy: {
        appointmentDate: 'asc',
      },
      skip: offset,
      take: limit,
    });
    
    return NextResponse.json({
      installations,
      pagination: {
        total: totalCount,
        limit,
        offset,
      }
    });
    
  } catch (error) {
    console.error('Error fetching installations:', error);
    return NextResponse.json({ error: 'Failed to fetch installations' }, { status: 500 });
  }
}

// POST a new installation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      vehicleMake,
      vehicleModel,
      vehicleYear,
      tireSize,
      tireQuantity,
      purchasedFrom,
      appointmentDate,
      appointmentTime,
      customerName,
      customerEmail,
      customerPhone,
      comments,
      serviceType = 'STANDARD',
      additionalServices = [],
    } = body;
    
    // Validate required fields
    if (!vehicleMake || !vehicleModel || !vehicleYear || !tireSize || 
        !tireQuantity || !appointmentDate || !appointmentTime || 
        !customerName || !customerEmail || !customerPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Calculate price based on service type and quantity
    let basePrice = 0;
    switch (serviceType) {
      case 'PREMIUM':
        basePrice = 30 * tireQuantity;
        break;
      case 'SPECIALTY':
        basePrice = 40 * tireQuantity;
        break;
      default:
        basePrice = 20 * tireQuantity; // STANDARD
    }
    
    // Calculate total price including additional services
    const additionalServicesTotal = additionalServices.reduce(
      (total: number, service: { price: number }) => total + service.price, 
      0
    );
    
    const totalPrice = basePrice + additionalServicesTotal;
    
    // Parse date and time to create a proper appointment DateTime
    const [year, month, day] = appointmentDate.split('-').map(Number);
    const [hours, minutes] = appointmentTime.split(':').map(Number);
    const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);
    
    // Create the installation record
    const installation = await prisma.installation.create({
      data: {
        vehicleMake,
        vehicleModel,
        vehicleYear,
        tireSize,
        tireQuantity,
        purchasedFrom: purchasedFrom === 'us' ? PurchaseLocation.OUR_STORE : PurchaseLocation.ELSEWHERE,
        appointmentDate: appointmentDateTime,
        appointmentTime,
        customerName,
        customerEmail,
        customerPhone,
        comments,
        serviceType: serviceType as InstallationServiceType,
        basePrice,
        totalPrice,
        status: InstallationStatus.SCHEDULED,
        additionalServices: {
          create: additionalServices.map((service: { serviceName: string, price: number }) => ({
            serviceName: service.serviceName,
            price: service.price,
          })),
        },
      },
      include: {
        additionalServices: true,
      },
    });
    
    return NextResponse.json({ installation });
    
  } catch (error) {
    console.error('Error creating installation:', error);
    return NextResponse.json({ error: 'Failed to create installation' }, { status: 500 });
  }
}
