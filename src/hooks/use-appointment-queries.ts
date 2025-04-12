import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  cancelAppointment,
  getAvailableTimeSlots,
  type Appointment,
  type AppointmentSearchParams,
  type CreateAppointmentData
} from "@/lib/api/appointment-api";

// Hook to fetch appointments with optional filtering
export function useAppointments(params?: Partial<AppointmentSearchParams>) {
  return useQuery({
    queryKey: ["appointments", params],
    queryFn: () => getAppointments(params),
  });
}

// Hook to fetch a single appointment by ID
export function useAppointment(appointmentId: string) {
  return useQuery({
    queryKey: ["appointment", appointmentId],
    queryFn: () => getAppointmentById(appointmentId),
    enabled: !!appointmentId,
  });
}

// Hook to create a new appointment
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateAppointmentData) => createAppointment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

// Hook to cancel an appointment
export function useCancelAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (appointmentId: string) => cancelAppointment(appointmentId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment", data.id] });
    },
  });
}

// Hook to get available time slots for a specific date
export function useAvailableTimeSlots(date: string) {
  return useQuery({
    queryKey: ["availableTimeSlots", date],
    queryFn: () => getAvailableTimeSlots(date),
    enabled: !!date,
  });
}