import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { InstallationStatus } from '@prisma/client';
import { authOptions } from '@/lib/auth/auth-options';

interface Params {
  params: {
    id: string;
  };
}

// GET a single installation by ID
export async function GET(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    // Make sure the user is an admin
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    
    const installation = await prisma.installation.findUnique({
      where: { id },
      include: {
        additionalServices: true,
      },
    });
    
    if (!installation) {
      return NextResponse.json({ error: 'Installation not found' }, { status: 404 });
    }
    
    return NextResponse.json({ installation });
    
  } catch (error) {
    console.error('Error fetching installation:', error);
    return NextResponse.json({ error: 'Failed to fetch installation' }, { status: 500 });
  }
}

// PATCH to update an installation
export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    // Make sure the user is an admin
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    const body = await request.json();
    
    // Check if the installation exists
    const existingInstallation = await prisma.installation.findUnique({
      where: { id },
      include: { additionalServices: true },
    });
    
    if (!existingInstallation) {
      return NextResponse.json({ error: 'Installation not found' }, { status: 404 });
    }
    
    // Extract updateable fields
    const {
      status,
      serviceType,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      tireSize,
      tireQuantity,
      purchasedFrom,
      appointmentDate,
      appointmentTime,
      completedDate,
      technician,
      bay,
      customerName,
      customerEmail,
      customerPhone,
      comments,
      additionalServices,
    } = body;
    
    // Prepare update data
    const updateData: any = {};
    
    // Only include fields that are provided
    if (status) updateData.status = status;
    if (serviceType) updateData.serviceType = serviceType;
    if (vehicleMake) updateData.vehicleMake = vehicleMake;
    if (vehicleModel) updateData.vehicleModel = vehicleModel;
    if (vehicleYear) updateData.vehicleYear = vehicleYear;
    if (tireSize) updateData.tireSize = tireSize;
    if (tireQuantity) updateData.tireQuantity = tireQuantity;
    if (purchasedFrom) updateData.purchasedFrom = purchasedFrom;
    if (appointmentDate || appointmentTime) {
      // If both date and time are provided, update the appointment datetime
      if (appointmentDate && appointmentTime) {
        const [year, month, day] = appointmentDate.split('-').map(Number);
        const [hours, minutes] = appointmentTime.split(':').map(Number);
        updateData.appointmentDate = new Date(year, month - 1, day, hours, minutes);
        updateData.appointmentTime = appointmentTime;
      } else if (appointmentDate) {
        // If only date is provided, keep the same time
        const [year, month, day] = appointmentDate.split('-').map(Number);
        const currentAppointment = new Date(existingInstallation.appointmentDate);
        updateData.appointmentDate = new Date(year, month - 1, day, 
          currentAppointment.getHours(), currentAppointment.getMinutes());
      } else if (appointmentTime) {
        // If only time is provided, keep the same date
        const [hours, minutes] = appointmentTime.split(':').map(Number);
        const currentAppointment = new Date(existingInstallation.appointmentDate);
        updateData.appointmentDate = new Date(
          currentAppointment.getFullYear(),
          currentAppointment.getMonth(),
          currentAppointment.getDate(),
          hours,
          minutes
        );
        updateData.appointmentTime = appointmentTime;
      }
    }
    
    if (completedDate) updateData.completedDate = new Date(completedDate);
    if (technician) updateData.technician = technician;
    if (bay) updateData.bay = bay;
    if (customerName) updateData.customerName = customerName;
    if (customerEmail) updateData.customerEmail = customerEmail;
    if (customerPhone) updateData.customerPhone = customerPhone;
    if (comments !== undefined) updateData.comments = comments;
    
    // If changing to COMPLETED status and no completedDate is provided, set to now
    if (status === InstallationStatus.COMPLETED && !completedDate) {
      updateData.completedDate = new Date();
    }
    
    // Recalculate pricing if service type or quantity changed
    if (serviceType || tireQuantity) {
      const newQuantity = tireQuantity || existingInstallation.tireQuantity;
      const newServiceType = serviceType || existingInstallation.serviceType;
      
      let basePrice = 0;
      switch (newServiceType) {
        case 'PREMIUM':
          basePrice = 30 * newQuantity;
          break;
        case 'SPECIALTY':
          basePrice = 40 * newQuantity;
          break;
        default:
          basePrice = 20 * newQuantity; // STANDARD
      }
      
      updateData.basePrice = basePrice;
      
      // Calculate total price including existing additional services
      const existingAdditionalServicesTotal = existingInstallation.additionalServices.reduce(
        (total, service) => total + service.price, 
        0
      );
      
      updateData.totalPrice = basePrice + existingAdditionalServicesTotal;
    }
    
    // Update additional services if provided
    if (additionalServices) {
      // Delete existing additional services
      await prisma.installationAdditionalService.deleteMany({
        where: { installationId: id },
      });
      
      // Create new additional services
      const newAdditionalServices = additionalServices.map((service: any) => ({
        serviceName: service.serviceName,
        price: service.price,
        installationId: id,
      }));
      
      if (newAdditionalServices.length > 0) {
        await prisma.installationAdditionalService.createMany({
          data: newAdditionalServices,
        });
      }
      
      // Recalculate total price
      const additionalServicesTotal = additionalServices.reduce(
        (total: number, service: { price: number }) => total + service.price, 
        0
      );
      
      updateData.totalPrice = (updateData.basePrice || existingInstallation.basePrice) + additionalServicesTotal;
    }
    
    // Update the installation
    const updatedInstallation = await prisma.installation.update({
      where: { id },
      data: updateData,
      include: {
        additionalServices: true,
      },
    });
    
    return NextResponse.json({ installation: updatedInstallation });
    
  } catch (error) {
    console.error('Error updating installation:', error);
    return NextResponse.json({ error: 'Failed to update installation' }, { status: 500 });
  }
}

// DELETE an installation
export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    // Make sure the user is an admin
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    
    // Check if the installation exists
    const existingInstallation = await prisma.installation.findUnique({
      where: { id },
    });
    
    if (!existingInstallation) {
      return NextResponse.json({ error: 'Installation not found' }, { status: 404 });
    }
    
    // Delete the installation (will cascade delete additional services)
    await prisma.installation.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error deleting installation:', error);
    return NextResponse.json({ error: 'Failed to delete installation' }, { status: 500 });
  }
}
