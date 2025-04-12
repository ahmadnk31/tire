"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarAppointment, DEFAULT_BUSINESS_HOURS, appointmentsToEvents } from "@/lib/appointment-utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format as formatDate } from "date-fns";
import { Calendar, Clock, User, Mail, Phone, Car, FileText } from "lucide-react";

interface AppointmentDetailsProps {
  appointment: any;
  onClose: () => void;
}

// Component to display appointment details
function AppointmentDetails({ appointment, onClose }: AppointmentDetailsProps) {
  if (!appointment) return null;
  
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold">{appointment.serviceType.replace(/_/g, ' ').toLowerCase()
            .split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')}</h3>
          <p className="text-sm text-muted-foreground">
            {formatDate(new Date(appointment.appointmentDate), "MMMM d, yyyy")} at {appointment.appointmentTime}
          </p>
        </div>
        <Badge className={
          appointment.status === 'SCHEDULED' ? "bg-blue-100 text-blue-800 border-blue-200" :
          appointment.status === 'CONFIRMED' ? "bg-green-100 text-green-800 border-green-200" :
          appointment.status === 'COMPLETED' ? "bg-purple-100 text-purple-800 border-purple-200" :
          appointment.status === 'CANCELLED' ? "bg-red-100 text-red-800 border-red-200" :
          "bg-gray-100 text-gray-800 border-gray-200"
        }>
          {appointment.status.charAt(0) + appointment.status.slice(1).toLowerCase().replace('_', ' ')}
        </Badge>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">Customer</p>
            <p>{appointment.customerName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">Email</p>
            <p>{appointment.customerEmail}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">Phone</p>
            <p>{appointment.customerPhone}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">Date</p>
            <p>{formatDate(new Date(appointment.appointmentDate), "MMMM d, yyyy")}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">Time</p>
            <p>{appointment.appointmentTime} ({appointment.duration} minutes)</p>
          </div>
        </div>
        
        {appointment.vehicleInfo && (
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Vehicle</p>
              <p>{appointment.vehicleInfo}</p>
            </div>
          </div>
        )}
        
        {appointment.notes && (
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-muted-foreground mt-1" />
            <div>
              <p className="font-medium">Notes</p>
              <p>{appointment.notes}</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button 
          variant="default" 
          onClick={() => window.location.href = `/dashboard/appointments/${appointment.id}`}
        >
          View Full Details
        </Button>
      </div>
    </div>
  );
}

export function AppointmentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth');
  const [calendarEvents, setCalendarEvents] = useState<CalendarAppointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  // Calculate date range for fetching appointments
  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  
  // Fetch appointments for the current month
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['calendar-appointments', start.toISOString(), end.toISOString()],
    queryFn: async () => {
      const response = await axios.get('/api/appointments/availability', {
        params: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
      });
      return response.data;
    },
  });
  
  // Update calendar events when data changes
  useEffect(() => {
    if (data?.appointments) {
      const events = appointmentsToEvents(data.appointments);
      setCalendarEvents(events);
    }
  }, [data]);
  
  // Navigate to previous month
  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };
  
  // Navigate to next month
  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };
  
  // Handle calendar event click to show appointment details
  const handleEventClick = (info: any) => {
    const appointmentId = info.event.id;
    
    // Find the appointment in the data
    if (data?.appointments) {
      const appointment = data.appointments.find((a: any) => a.id === appointmentId);
      if (appointment) {
        setSelectedAppointment(appointment);
        setIsDetailsDialogOpen(true);
      }
    }
  };
  
  // Fetch appointments when calendar view changes
  const handleDatesSet = (info: any) => {
    const viewStart = info.view.activeStart;
    const viewEnd = info.view.activeEnd;
    
    // Only refetch if date range changes significantly
    if (viewStart < start || viewEnd > end) {
      refetch();
    }
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div>
              <CardTitle>Appointment Calendar</CardTitle>
              <CardDescription>View all scheduled appointments</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                Next
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue={calendarView} 
            onValueChange={(value) => setCalendarView(value as any)}
            className="space-y-4"
          >
            <div className="flex justify-end">
              <TabsList>
                <TabsTrigger value="dayGridMonth">Month</TabsTrigger>
                <TabsTrigger value="timeGridWeek">Week</TabsTrigger>
                <TabsTrigger value="timeGridDay">Day</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="dayGridMonth" className="m-0">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-[500px] w-full" />
                </div>
              ) : isError ? (
                <div className="flex justify-center items-center h-[500px]">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">Failed to load appointments</p>
                    <Button variant="outline" onClick={() => refetch()}>
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : (
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={false}
                  initialDate={currentDate}
                  events={calendarEvents}
                  eventClick={handleEventClick}
                  businessHours={DEFAULT_BUSINESS_HOURS}
                  height="auto"
                  aspectRatio={1.5}
                  dayMaxEvents={3}
                  datesSet={handleDatesSet}
                />
              )}
            </TabsContent>
            
            <TabsContent value="timeGridWeek" className="m-0">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-[700px] w-full" />
                </div>
              ) : isError ? (
                <div className="flex justify-center items-center h-[700px]">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">Failed to load appointments</p>
                    <Button variant="outline" onClick={() => refetch()}>
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : (
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="timeGridWeek"
                  headerToolbar={false}
                  initialDate={currentDate}
                  events={calendarEvents}
                  eventClick={handleEventClick}
                  businessHours={DEFAULT_BUSINESS_HOURS}
                  height="auto"
                  aspectRatio={1.5}
                  slotMinTime={DEFAULT_BUSINESS_HOURS.startTime}
                  slotMaxTime={DEFAULT_BUSINESS_HOURS.endTime}
                  allDaySlot={false}
                  datesSet={handleDatesSet}
                  nowIndicator
                />
              )}
            </TabsContent>
            
            <TabsContent value="timeGridDay" className="m-0">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-[700px] w-full" />
                </div>
              ) : isError ? (
                <div className="flex justify-center items-center h-[700px]">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">Failed to load appointments</p>
                    <Button variant="outline" onClick={() => refetch()}>
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : (
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="timeGridDay"
                  headerToolbar={false}
                  initialDate={currentDate}
                  events={calendarEvents}
                  eventClick={handleEventClick}
                  businessHours={DEFAULT_BUSINESS_HOURS}
                  height="auto"
                  aspectRatio={1.5}
                  slotMinTime={DEFAULT_BUSINESS_HOURS.startTime}
                  slotMaxTime={DEFAULT_BUSINESS_HOURS.endTime}
                  allDaySlot={false}
                  datesSet={handleDatesSet}
                  nowIndicator
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Appointment Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              View the details for this appointment
            </DialogDescription>
          </DialogHeader>
          <AppointmentDetails 
            appointment={selectedAppointment} 
            onClose={() => setIsDetailsDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}