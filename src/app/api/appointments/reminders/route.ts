import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { sendAppointmentReminderEmail } from '@/lib/aws/ses-utils';
import { z } from 'zod';
import { AppointmentStatus } from '@prisma/client';
import { addDays, isSameDay, isAfter, isBefore } from 'date-fns';

// Validation schema for query parameters
const reminderQuerySchema = z.object({
  days: z.coerce.number().int().min(0).max(7).optional().default(1),
  onlyScheduled: z.coerce.boolean().optional().default(true)
});

// POST endpoint to send reminders
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow admins and retailers to send reminders
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'RETAILER')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const { days, onlyScheduled } = reminderQuerySchema.parse({
      days: searchParams.get('days'),
      onlyScheduled: searchParams.get('onlyScheduled')
    });
    
    // Calculate the target date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = addDays(today, days);
    
    // Build the query to find appointments for the target date
    const where: any = {
      appointmentDate: {
        gte: targetDate,
        lt: addDays(targetDate, 1) // next day
      }
    };
    
    // Filter by status if onlyScheduled is true
    if (onlyScheduled) {
      where.status = {
        in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]
      };
    }
    
    // Find appointments for the target date
    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: {
        appointmentTime: 'asc'
      }
    });
    
    // Send reminder emails
    const results = await Promise.allSettled(
      appointments.map(async (appointment) => {
        try {
          await sendAppointmentReminderEmail(
            appointment.customerEmail,
            appointment.customerName,
            appointment.id,
            appointment.appointmentDate,
            appointment.appointmentTime,
            appointment.serviceType
          );
          
          return {
            id: appointment.id,
            customerEmail: appointment.customerEmail,
            success: true
          };
        } catch (error) {
          console.error(`Failed to send reminder email for appointment ${appointment.id}:`, error);
          return {
            id: appointment.id,
            customerEmail: appointment.customerEmail,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );
    
    // Count successes and failures
    const successful = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
    const failed = results.filter(r => r.status === 'rejected' || !(r.value as any).success).length;
    
    return NextResponse.json({
      message: `Sent ${successful} reminder emails (${failed} failed)`,
      total: appointments.length,
      successful,
      failed,
      date: targetDate.toISOString().split('T')[0],
      results: results.map(r => r.status === 'fulfilled' ? r.value : { 
        success: false, 
        error: r.reason instanceof Error ? r.reason.message : 'Unknown error' 
      })
    });
    
  } catch (error) {
    console.error('Error sending appointment reminders:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// GET endpoint to find appointments eligible for reminders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow admins and retailers to get reminder data
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'RETAILER')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const { days, onlyScheduled } = reminderQuerySchema.parse({
      days: searchParams.get('days'),
      onlyScheduled: searchParams.get('onlyScheduled')
    });
    
    // Calculate the target date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = addDays(today, days);
    
    // Build the query to find appointments for the target date
    const where: any = {
      appointmentDate: {
        gte: targetDate,
        lt: addDays(targetDate, 1) // next day
      }
    };
    
    // Filter by status if onlyScheduled is true
    if (onlyScheduled) {
      where.status = {
        in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]
      };
    }
    
    // Find appointments for the target date
    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: {
        appointmentTime: 'asc'
      }
    });
    
    return NextResponse.json({
      appointments,
      total: appointments.length,
      date: targetDate.toISOString().split('T')[0]
    });
    
  } catch (error) {
    console.error('Error getting appointments for reminders:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}