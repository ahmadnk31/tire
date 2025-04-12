import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import { AppointmentStatus, ServiceType } from '@prisma/client';
import { sendAppointmentConfirmationEmail } from '@/lib/aws/ses-utils';

// Appointment creation/update schema validation
const appointmentSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().min(10, 'Phone number must be at least 10 characters'),
  appointmentDate: z.string().transform(str => new Date(str)),
  appointmentTime: z.string().min(1, 'Appointment time is required'),
  duration: z.number().int().min(15, 'Duration must be at least 15 minutes'),
  serviceType: z.nativeEnum(ServiceType),
  vehicleInfo: z.string().optional(),
  notes: z.string().optional(),
  sendEmail: z.boolean().optional(),
});

// GET all appointments with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only allow admin or retailer to access all appointment data
    const isAdmin = session.user.role === 'ADMIN';
    const isRetailer = session.user.role === 'RETAILER';
    
    if (!isAdmin && !isRetailer) {
      // Regular users can only see their own appointments
      const userAppointments = await prisma.appointment.findMany({
        where: {
          userId: session.user.id
        },
        orderBy: {
          appointmentDate: 'desc'
        }
      });
      
      return NextResponse.json({ appointments: userAppointments });
    }
    
    // Parse query parameters for admins and retailers
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') as AppointmentStatus | null;
    const date = searchParams.get('date') ? new Date(searchParams.get('date') as string) : null;
    const search = searchParams.get('search');

    // Build the query
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (date) {
      where.appointmentDate = {
        gte: date,
        lt: new Date(date.getTime() + 24 * 60 * 60 * 1000), // Next day
      };
    }
    
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { vehicleInfo: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get appointments with pagination
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        orderBy: {
          appointmentDate: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.appointment.count({ where })
    ]);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      appointments,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });
    
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST create a new appointment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    // Extract sendEmail flag but don't pass it to database
    const { sendEmail = true, ...appointmentData } = body;
    
    // Validate request body
    const validatedData = appointmentSchema.parse(appointmentData);
    
    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        customerName: validatedData.customerName,
        customerEmail: validatedData.customerEmail,
        customerPhone: validatedData.customerPhone,
        appointmentDate: validatedData.appointmentDate,
        appointmentTime: validatedData.appointmentTime,
        duration: validatedData.duration,
        serviceType: validatedData.serviceType,
        vehicleInfo: validatedData.vehicleInfo,
        notes: validatedData.notes,
        // If user is logged in, associate the appointment with their account
        userId: session?.user?.id || null,
        status: AppointmentStatus.SCHEDULED
      }
    });
    
    // Send confirmation email if sendEmail is true
    if (sendEmail) {
      try {
        await sendAppointmentConfirmationEmail(
          validatedData.customerEmail,
          validatedData.customerName,
          appointment.id,
          validatedData.appointmentDate,
          validatedData.appointmentTime,
          validatedData.serviceType,
          validatedData.duration
        );
      } catch (emailError) {
        console.error('Failed to send appointment confirmation email:', emailError);
        // Continue even if email fails
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      appointment
    });
    
  } catch (error) {
    console.error('Error creating appointment:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}