// Helper types for appointments
export interface CalendarAppointment {
  id: string;
  title: string;
  start: Date;
  end: Date;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: {
    serviceType: string;
    status: string;
  };
}

export interface BusinessHour {
  id?: string;
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

// Default business hours as fallback
export const DEFAULT_BUSINESS_HOURS = {
  startTime: '09:00', // 9:00 AM
  endTime: '17:00',   // 5:00 PM
  daysOfWeek: [1, 2, 3, 4, 5, 6], // Monday - Saturday (0=Sunday, 1=Monday, etc.)
};

// Function to fetch business hours from the API
export async function fetchBusinessHours(): Promise<BusinessHour[]> {
  try {
    const response = await fetch('/api/business-hours', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-cache', // Don't cache this request
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch business hours');
    }
    
    const data = await response.json();
    return data.businessHours;
  } catch (error) {
    console.error('Error fetching business hours:', error);
    return []; // Return empty array if there's an error
  }
}

// Convert business hours from the database to FullCalendar format
export function formatBusinessHoursForCalendar(businessHours: BusinessHour[]) {
  return businessHours
    .filter(hour => hour.isOpen)
    .map(hour => ({
      daysOfWeek: [hour.dayOfWeek],
      startTime: hour.openTime,
      endTime: hour.closeTime
    }));
}

// Convert appointment data from API to FullCalendar event format
export function appointmentsToEvents(appointments: any[]): CalendarAppointment[] {
  return appointments.map(appointment => {
    const appointmentDate = new Date(appointment.appointmentDate);
    const [hours, minutes] = parseTimeString(appointment.appointmentTime);
    
    // Set start time
    const start = new Date(appointmentDate);
    start.setHours(hours, minutes, 0, 0);
    
    // Calculate end time based on duration
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + appointment.duration);
    
    // Set color based on status
    let backgroundColor = '#3b82f6'; // blue for scheduled
    let borderColor = '#2563eb';
    let textColor = '#ffffff';
    
    if (appointment.status === 'CONFIRMED') {
      backgroundColor = '#10b981'; // green for confirmed
      borderColor = '#059669';
    }
    
    return {
      id: appointment.id,
      title: getServiceTypeLabel(appointment.serviceType),
      start,
      end,
      backgroundColor,
      borderColor,
      textColor,
      extendedProps: {
        serviceType: appointment.serviceType,
        status: appointment.status
      }
    };
  });
}

// Parse time string (e.g., "10:30 AM") and return [hours, minutes]
export function parseTimeString(timeString: string): [number, number] {
  const match = timeString.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  
  if (!match) {
    return [0, 0]; // Default to midnight if format is not recognized
  }
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();
  
  // Handle 12-hour format
  if (period === 'PM' && hours < 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return [hours, minutes];
}

// Get a friendly service type label
export function getServiceTypeLabel(serviceType: string): string {
  const labels: Record<string, string> = {
    'TIRE_INSTALLATION': 'Tire Installation',
    'TIRE_ROTATION': 'Tire Rotation',
    'WHEEL_ALIGNMENT': 'Wheel Alignment',
    'FLAT_REPAIR': 'Flat Repair',
    'TIRE_BALANCING': 'Tire Balancing',
    'TIRE_INSPECTION': 'Tire Inspection',
    'OTHER': 'Other Service'
  };
  
  return labels[serviceType] || serviceType;
}

// Convert time to 12-hour format string (e.g., "9:00 AM")
export function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  
  return `${hours}:${minutesStr} ${ampm}`;
}

// Check if a time slot is available (not conflicting with existing appointments)
export async function isTimeSlotAvailable(
  date: Date, 
  time: string, 
  duration: number, 
  existingAppointments: CalendarAppointment[],
  businessHours?: BusinessHour[]
): Promise<boolean> {
  // Parse the time string
  const [hours, minutes] = parseTimeString(time);
  
  // Create start and end dates for the proposed appointment
  const startDate = new Date(date);
  startDate.setHours(hours, minutes, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + duration);
  
  // Get business hours if not provided
  if (!businessHours || businessHours.length === 0) {
    businessHours = await fetchBusinessHours();
  }
  
  const dayOfWeek = startDate.getDay();
  
  // If no business hours were found, use default values
  if (businessHours.length === 0) {
    if (!DEFAULT_BUSINESS_HOURS.daysOfWeek.includes(dayOfWeek)) {
      return false; // Not a business day
    }
    
    const [businessStartHours, businessStartMinutes] = parseTimeString(DEFAULT_BUSINESS_HOURS.startTime);
    const [businessEndHours, businessEndMinutes] = parseTimeString(DEFAULT_BUSINESS_HOURS.endTime);
    
    const businessStart = new Date(startDate);
    businessStart.setHours(businessStartHours, businessStartMinutes, 0, 0);
    
    const businessEnd = new Date(startDate);
    businessEnd.setHours(businessEndHours, businessEndMinutes, 0, 0);
    
    if (startDate < businessStart || endDate > businessEnd) {
      return false; // Outside business hours
    }
  } else {
    // Find business hours for the selected day
    const businessHoursForDay = businessHours.find(h => h.dayOfWeek === dayOfWeek);
    
    // If no business hours found for this day or the business is closed, return false
    if (!businessHoursForDay || !businessHoursForDay.isOpen) {
      return false;
    }
    
    // Check if the time is within business hours
    const [businessStartHours, businessStartMinutes] = parseTimeString(businessHoursForDay.openTime);
    const [businessEndHours, businessEndMinutes] = parseTimeString(businessHoursForDay.closeTime);
    
    const businessStart = new Date(startDate);
    businessStart.setHours(businessStartHours, businessStartMinutes, 0, 0);
    
    const businessEnd = new Date(startDate);
    businessEnd.setHours(businessEndHours, businessEndMinutes, 0, 0);
    
    if (startDate < businessStart || endDate > businessEnd) {
      return false; // Outside business hours
    }
  }
  
  // Check for conflicts with existing appointments
  for (const appointment of existingAppointments) {
    // If there's any overlap between the new appointment and an existing one
    if (
      (startDate >= appointment.start && startDate < appointment.end) || // New start time is during an existing appointment
      (endDate > appointment.start && endDate <= appointment.end) || // New end time is during an existing appointment
      (startDate <= appointment.start && endDate >= appointment.end) // New appointment completely contains an existing one
    ) {
      return false; // There's a conflict
    }
  }
  
  return true; // No conflicts found
}

// Generate available time slots for a given date
export async function generateAvailableTimeSlots(
  date: Date, 
  duration: number, 
  existingAppointments: CalendarAppointment[], 
  interval: number = 30 // minutes between slots
): Promise<string[]> {
  const availableSlots: string[] = [];
  
  // Fetch business hours from the API
  const businessHours = await fetchBusinessHours();
  
  // Get the day of the week (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = date.getDay();
  
  // If no business hours were found, use default values
  if (businessHours.length === 0) {
    const [businessStartHours, businessStartMinutes] = parseTimeString(DEFAULT_BUSINESS_HOURS.startTime);
    const [businessEndHours, businessEndMinutes] = parseTimeString(DEFAULT_BUSINESS_HOURS.endTime);
    
    // Set the start time to the business opening time
    const startTime = new Date(date);
    startTime.setHours(businessStartHours, businessStartMinutes, 0, 0);
    
    // Set the end time to the business closing time minus the appointment duration
    const endTime = new Date(date);
    endTime.setHours(businessEndHours, businessEndMinutes, 0, 0);
    endTime.setMinutes(endTime.getMinutes() - duration);
    
    // Return empty array if the day is not a business day
    if (!DEFAULT_BUSINESS_HOURS.daysOfWeek.includes(dayOfWeek)) {
      return availableSlots;
    }
    
    // Generate potential time slots
    const currentTime = new Date(startTime);
    while (currentTime <= endTime) {
      const timeString = formatTime(currentTime);
      
      // Check if this time slot is available
      if (await isTimeSlotAvailable(date, timeString, duration, existingAppointments, businessHours)) {
        availableSlots.push(timeString);
      }
      
      // Move to the next interval
      currentTime.setMinutes(currentTime.getMinutes() + interval);
    }
    
    return availableSlots;
  }
  
  // Find business hours for the selected day
  const businessHoursForDay = businessHours.find(h => h.dayOfWeek === dayOfWeek);
  
  // If no business hours found for this day or the business is closed, return empty array
  if (!businessHoursForDay || !businessHoursForDay.isOpen) {
    return availableSlots;
  }
  
  // Parse business hours
  const [businessStartHours, businessStartMinutes] = parseTimeString(businessHoursForDay.openTime);
  const [businessEndHours, businessEndMinutes] = parseTimeString(businessHoursForDay.closeTime);
  
  // Set the start time to the business opening time
  const startTime = new Date(date);
  startTime.setHours(businessStartHours, businessStartMinutes, 0, 0);
  
  // Set the end time to the business closing time minus the appointment duration
  const endTime = new Date(date);
  endTime.setHours(businessEndHours, businessEndMinutes, 0, 0);
  endTime.setMinutes(endTime.getMinutes() - duration);
  
  // Generate potential time slots
  const currentTime = new Date(startTime);
  while (currentTime <= endTime) {
    const timeString = formatTime(currentTime);
    
    // Check if this time slot is available
    if (await isTimeSlotAvailable(date, timeString, duration, existingAppointments, businessHours)) {
      availableSlots.push(timeString);
    }
    
    // Move to the next interval
    currentTime.setMinutes(currentTime.getMinutes() + interval);
  }
  
  return availableSlots;
}