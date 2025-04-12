"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Clock, Info } from "lucide-react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  CalendarAppointment, 
  DEFAULT_BUSINESS_HOURS,
  appointmentsToEvents, 
  generateAvailableTimeSlots,
  getServiceTypeLabel 
} from "@/lib/appointment-utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Define the form schema
const formSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Please enter a valid email address"),
  customerPhone: z.string().min(10, "Please enter a valid phone number"),
  appointmentDate: z.date({
    required_error: "Please select a date for your appointment",
  }),
  appointmentTime: z.string({
    required_error: "Please select a time for your appointment",
  }),
  serviceType: z.enum([
    "TIRE_INSTALLATION",
    "TIRE_ROTATION",
    "WHEEL_ALIGNMENT",
    "FLAT_REPAIR",
    "TIRE_BALANCING",
    "TIRE_INSPECTION",
    "OTHER",
  ], {
    required_error: "Please select a service type",
  }),
  vehicleInfo: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AppointmentFormProps {
  onSubmit: (data: FormData) => Promise<boolean>;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
}

// Service type durations in minutes
const SERVICE_DURATIONS = {
  TIRE_INSTALLATION: 60,
  TIRE_ROTATION: 30,
  WHEEL_ALIGNMENT: 60,
  FLAT_REPAIR: 45,
  TIRE_BALANCING: 45,
  TIRE_INSPECTION: 30,
  OTHER: 60,
};

export function AppointmentForm({ onSubmit, user }: AppointmentFormProps) {
  // Get translations
  const t = useTranslations('form');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [view, setView] = useState<'form' | 'calendar'>('calendar');
  const [calendarEvents, setCalendarEvents] = useState<CalendarAppointment[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  
  // Set up the form with default values
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: user?.name || "",
      customerEmail: user?.email || "",
      customerPhone: "",
      vehicleInfo: "",
      notes: "",
    },
  });
  
  // Get the selected service type and its duration
  const serviceType = form.watch("serviceType");
  const duration = serviceType ? SERVICE_DURATIONS[serviceType as keyof typeof SERVICE_DURATIONS] : 30;
  
  // Fetch existing appointments for the calendar
  const fetchAppointments = async (start: Date, end: Date) => {
    try {
      const response = await axios.get("/api/appointments/availability", {
        params: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
      });
      
      if (response.data.appointments) {
        const events = appointmentsToEvents(response.data.appointments);
        setCalendarEvents(events);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error(t('errors.appointmentError'));
    }
  };
  
  // Fetch available time slots when date changes
  const fetchAvailableTimeSlots = async (date: Date) => {
    setFetchingSlots(true);
    try {
      // Create a range for just this day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Fetch appointments for the selected day
      const response = await axios.get("/api/appointments/availability", {
        params: {
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString(),
        },
      });
      
      if (response.data.appointments) {
        const events = appointmentsToEvents(response.data.appointments);
        
        // Generate available time slots based on existing appointments
        const slots = generateAvailableTimeSlots(date, duration, events);
        setAvailableTimeSlots(await slots);
      } else {
        // If no appointments, all slots are available
        setAvailableTimeSlots([]);
      }
    } catch (error) {
      console.error("Error fetching time slots:", error);
      toast.error(t('errors.fetchError'));
      setAvailableTimeSlots([]);
    } finally {
      setFetchingSlots(false);
    }
  };
  
  // Handle date click in the calendar
  const handleDateClick = (info: any) => {
    const clickedDate = new Date(info.date);
    
    // Don't allow selecting past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (clickedDate < today) {
      toast.error(t('errors.pastDates'));
      return;
    }
    
    // Don't allow selecting Sundays
    if (clickedDate.getDay() === 0) {
      toast.error(t('errors.closedDays'));
      return;
    }
    
    // Set the selected date in the form
    form.setValue("appointmentDate", clickedDate);
    setSelectedDate(clickedDate);
    
    // Fetch available time slots for the selected date
    fetchAvailableTimeSlots(clickedDate);
    
    // Switch to form view
    setView('form');
  };
  
  // Handle time slot selection
  const handleTimeSlotSelect = (time: string) => {
    form.setValue("appointmentTime", time);
  };
  
  // Handler for form submission
  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Add service duration based on service type
      const formData = {
        ...data,
        userId: user?.id,
        duration: SERVICE_DURATIONS[data.serviceType as keyof typeof SERVICE_DURATIONS],
      };
      
      const success = await onSubmit(formData);
      if (success) {
        form.reset();
        setView('calendar');
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(t('errors.submissionError'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Fetch appointments when calendar view changes
  const handleDatesSet = (calendarInfo: any) => {
    fetchAppointments(calendarInfo.view.activeStart, calendarInfo.view.activeEnd);
  };
  
  // Effect to update available time slots when service type or date changes
  useEffect(() => {
    if (selectedDate && serviceType) {
      fetchAvailableTimeSlots(selectedDate);
    }
  }, [serviceType, selectedDate]);
  
  // Reset the appointment time when changing service (since duration affects availability)
  useEffect(() => {
    if (form.formState.isDirty && form.getValues("appointmentTime")) {
      form.setValue("appointmentTime", "");
    }
  }, [serviceType]);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-center mb-4">
        <div className="inline-flex rounded-lg border p-1">
          <Button
            variant={view === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('calendar')}
            className="rounded-md px-3"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {t('view.calendar')}
          </Button>
          <Button
            variant={view === 'form' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('form')}
            className="rounded-md px-3"
          >
            <Clock className="mr-2 h-4 w-4" />
            {t('view.form')}
          </Button>
        </div>
      </div>
      
      {view === 'calendar' ? (
        <div className="calendar-container">
          <Alert className="mb-4">
            <Info className="h-4 w-4 mr-2" />
            <AlertDescription>
              {t('alert')}
            </AlertDescription>
          </Alert>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek'
            }}
            businessHours={DEFAULT_BUSINESS_HOURS}
            events={calendarEvents}
            dateClick={handleDateClick}
            datesSet={handleDatesSet}
            height="auto"
            editable={false}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            nowIndicator={true}
            eventTimeFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short'
            }}
            validRange={{
              start: new Date() // Disable past dates
            }}
          />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Name */}
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.name.label')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('fields.name.placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Customer Email */}
              <FormField
                control={form.control}
                name="customerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.email.label')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('fields.email.placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Customer Phone */}
              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.phone.label')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('fields.phone.placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Service Type */}
              <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.serviceType.label')}</FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('fields.serviceType.placeholder')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="TIRE_INSTALLATION">{t('fields.serviceType.options.TIRE_INSTALLATION')}</SelectItem>
                                <SelectItem value="TIRE_ROTATION">{t('fields.serviceType.options.TIRE_ROTATION')}</SelectItem>
                                <SelectItem value="WHEEL_ALIGNMENT">{t('fields.serviceType.options.WHEEL_ALIGNMENT')}</SelectItem>
                                <SelectItem value="FLAT_REPAIR">{t('fields.serviceType.options.FLAT_REPAIR')}</SelectItem>
                                <SelectItem value="TIRE_BALANCING">{t('fields.serviceType.options.TIRE_BALANCING')}</SelectItem>
                                <SelectItem value="TIRE_INSPECTION">{t('fields.serviceType.options.TIRE_INSPECTION')}</SelectItem>
                                <SelectItem value="OTHER">{t('fields.serviceType.options.OTHER')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('fields.serviceType.tooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Appointment Date */}
              <FormField
                control={form.control}
                name="appointmentDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('fields.appointmentDate.label')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>{t('fields.appointmentDate.placeholder')}</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            if (date) {
                              setSelectedDate(date);
                              fetchAvailableTimeSlots(date);
                            }
                          }}
                          disabled={(date) => 
                            date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                            date.getDay() === 0 // Disable Sundays
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Appointment Time */}
              <FormField
                control={form.control}
                name="appointmentTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.appointmentTime.label')}</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={!selectedDate || !serviceType || fetchingSlots}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            fetchingSlots 
                              ? t('fields.appointmentTime.loading')
                              : availableTimeSlots.length === 0 && selectedDate 
                                ? t('fields.appointmentTime.noTimes')
                                : t('fields.appointmentTime.placeholder')
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableTimeSlots.length === 0 && selectedDate ? (
                          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                            {t('fields.appointmentTime.noTimeSlotsMessage')}
                          </div>
                        ) : (
                          availableTimeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time} ({duration} {t('fields.appointmentTime.minutesLabel')})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Vehicle Information */}
            <FormField
              control={form.control}
              name="vehicleInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.vehicleInfo.label')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('fields.vehicleInfo.placeholder')}
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.notes.label')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('fields.notes.placeholder')}
                      className="resize-none" 
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setView('calendar')}
              >
                {t('buttons.backToCalendar')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('buttons.booking') : t('buttons.bookAppointment')}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}