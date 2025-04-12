import { z } from "zod";

// Define types for Appointment data
export type Appointment = {
  id: string;
  userId: string;
  serviceType: string;
  selectedDate: string;
  selectedTime: string;
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    licensePlate?: string;
  };
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  appointmentNotes?: string;
  createdAt: string;
  updatedAt: string;
};

// Appointment search parameters schema
export const AppointmentSearchParamsSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).optional(),
  date: z.string().optional(), // ISO date string for filtering by date
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
});

export type AppointmentSearchParams = z.infer<typeof AppointmentSearchParamsSchema>;

// API response type
export type AppointmentListResponse = {
  appointments: Appointment[];
  totalCount: number;
  page: number;
  perPage: number;
  totalPages: number;
};

// Schema for creating a new appointment
export const CreateAppointmentSchema = z.object({
  serviceType: z.string(),
  selectedDate: z.string(), // ISO date string
  selectedTime: z.string(), // Time string
  vehicleInfo: z.object({
    make: z.string(),
    model: z.string(),
    year: z.number(),
    licensePlate: z.string().optional(),
  }),
  appointmentNotes: z.string().optional(),
});

export type CreateAppointmentData = z.infer<typeof CreateAppointmentSchema>;

/**
 * Fetch appointments with optional pagination and filtering
 */
export async function getAppointments(params?: Partial<AppointmentSearchParams>): Promise<AppointmentListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.date) searchParams.set("date", params.date);
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.perPage) searchParams.set("perPage", params.perPage.toString());

  const response = await fetch(`/api/appointments?${searchParams.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch appointments: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch a single appointment by ID
 */
export async function getAppointmentById(appointmentId: string): Promise<Appointment> {
  const response = await fetch(`/api/appointments/${appointmentId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch appointment: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new appointment
 */
export async function createAppointment(data: CreateAppointmentData): Promise<Appointment> {
  const response = await fetch('/api/appointments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create appointment: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(appointmentId: string): Promise<Appointment> {
  const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to cancel appointment: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get available appointment time slots for a specific date
 */
export async function getAvailableTimeSlots(date: string) {
  const response = await fetch(`/api/appointments/available-slots?date=${date}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch available time slots: ${response.statusText}`);
  }

  return response.json();
}