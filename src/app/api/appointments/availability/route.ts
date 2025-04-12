import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

// GET appointments for availability check
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // Convert string dates to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Get all appointments in the date range
    const appointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: start,
          lte: end
        },
        // Only include scheduled, confirmed appointments (not cancelled)
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
      },
      select: {
        id: true,
        appointmentDate: true,
        appointmentTime: true,
        duration: true,
        serviceType: true,
        status: true
      }
    });
    
    return NextResponse.json({ appointments });
    
  } catch (error) {
    console.error('Error fetching appointment availability:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}