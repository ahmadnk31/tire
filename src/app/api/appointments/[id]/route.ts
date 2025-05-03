import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { z } from "zod";
import { AppointmentStatus, ServiceType } from "@prisma/client";
import { sendAppointmentStatusChangeEmail } from "@/lib/aws/ses-utils";

// Appointment update schema validation
const appointmentUpdateSchema = z.object({
  customerName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .optional(),
  customerEmail: z.string().email("Invalid email address").optional(),
  customerPhone: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .optional(),
  appointmentDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  appointmentTime: z.string().min(1, "Appointment time is required").optional(),
  duration: z
    .number()
    .int()
    .min(15, "Duration must be at least 15 minutes")
    .optional(),
  serviceType: z.nativeEnum(ServiceType).optional(),
  vehicleInfo: z.string().optional(),
  notes: z.string().optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  sendEmail: z.boolean().optional(),
});

// GET a single appointment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const appointmentId = id;

    // Build query - different access levels based on user role
    let where = { id: appointmentId };

    // Regular users can only see their own appointments
    if (session.user.role === "USER") {
      where = {
        ...where,
        userId: session.user.id,
      } as any;
    }

    const appointment = await prisma.appointment.findUnique({
      where,
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // If the user is not an admin/retailer and isn't the appointment owner, deny access
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "RETAILER" &&
      appointment.userId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "You do not have permission to view this appointment" },
        { status: 403 }
      );
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error(`Error fetching appointment ${params.id}:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH/Update an appointment
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appointmentId = params.id;
    const body = await request.json();

    // Extract sendEmail flag but don't pass it to database
    const { sendEmail = true, ...updateData } = body;

    // Validate the update data
    const validatedData = appointmentUpdateSchema.parse(updateData);

    // Check if the appointment exists and if the user has permission
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            language: true,
          },
        },
      },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Only admin, retailer, or the appointment owner can update
    const isAdmin = session.user.role === "ADMIN";
    const isRetailer = session.user.role === "RETAILER";
    const isOwner = existingAppointment.userId === session.user.id;

    if (!isAdmin && !isRetailer && !isOwner) {
      return NextResponse.json(
        { error: "You do not have permission to update this appointment" },
        { status: 403 }
      );
    }

    // Apply the updates
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: validatedData,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            language: true,
          },
        },
      },
    });

    // Send email notification if status changed and sendEmail is true
    if (
      sendEmail &&
      validatedData.status &&
      validatedData.status !== existingAppointment.status
    ) {
      try {
        const customerEmail = updatedAppointment.customerEmail;
        const customerName = updatedAppointment.customerName;
        // Get the user's language preference
        const userLanguage = updatedAppointment.user?.language || "en";

        await sendAppointmentStatusChangeEmail(
          customerEmail,
          customerName,
          updatedAppointment.id,
          updatedAppointment.appointmentDate,
          updatedAppointment.appointmentTime,
          updatedAppointment.serviceType,
          updatedAppointment.status,
          userLanguage
        );
      } catch (emailError) {
        console.error(
          "Failed to send appointment status update email:",
          emailError
        );
        // Continue even if email fails
      }
    }

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error(`Error updating appointment ${params.id}:`, error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE an appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appointmentId = params.id;

    // Check if the appointment exists and if the user has permission
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            language: true,
          },
        },
      },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Only admin, retailer, or the appointment owner can delete
    const isAdmin = session.user.role === "ADMIN";
    const isRetailer = session.user.role === "RETAILER";
    const isOwner = existingAppointment.userId === session.user.id;

    if (!isAdmin && !isRetailer && !isOwner) {
      return NextResponse.json(
        { error: "You do not have permission to delete this appointment" },
        { status: 403 }
      );
    }

    // For soft-delete, we can just update the status to CANCELLED
    // If you want a hard delete, use prisma.appointment.delete() instead
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.CANCELLED },
    });

    // Send cancellation email
    try {
      // Get the user's language preference
      const userLanguage = existingAppointment.user?.language || "en";

      await sendAppointmentStatusChangeEmail(
        existingAppointment.customerEmail,
        existingAppointment.customerName,
        existingAppointment.id,
        existingAppointment.appointmentDate,
        existingAppointment.appointmentTime,
        existingAppointment.serviceType,
        "CANCELLED",
        userLanguage
      );
    } catch (emailError) {
      console.error(
        "Failed to send appointment cancellation email:",
        emailError
      );
      // Continue even if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    console.error(`Error deleting appointment ${params.id}:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
