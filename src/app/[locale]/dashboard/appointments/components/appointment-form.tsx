"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Services offered by the tire shop
const serviceTypes = [
  { value: "TIRE_INSTALLATION", label: "Tire Installation" },
  { value: "TIRE_ROTATION", label: "Tire Rotation" },
  { value: "WHEEL_ALIGNMENT", label: "Wheel Alignment" },
  { value: "FLAT_REPAIR", label: "Flat Repair" },
  { value: "TIRE_BALANCING", label: "Tire Balancing" },
  { value: "TIRE_INSPECTION", label: "Tire Inspection" },
  { value: "OTHER", label: "Other Services" },
];

// Common time slots for appointments
const timeSlots = [
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", 
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM"
];

// Duration options for each service type (in minutes)
const durationOptions = [
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1 hour 30 minutes" },
  { value: 120, label: "2 hours" },
];

// Form schema for validation
const formSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  appointmentDate: z.date({
    required_error: "Please select a date",
  }),
  appointmentTime: z.string({
    required_error: "Please select a time slot",
  }),
  duration: z.number({
    required_error: "Please select appointment duration",
  }),
  serviceType: z.string({
    required_error: "Please select a service type",
  }),
  vehicleInfo: z.string().optional(),
  notes: z.string().optional(),
});

// Define the type for our form data
type FormValues = z.infer<typeof formSchema>;

// Define appointment interface
interface Appointment {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  appointmentDate: string | Date;
  appointmentTime: string;
  duration: number;
  serviceType: string;
  vehicleInfo?: string;
  notes?: string;
  status: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

// Define props for the component
interface AppointmentFormProps {
  appointment?: Appointment;
  onSubmit: (data: FormValues) => Promise<boolean>;
}

export function AppointmentForm({ appointment, onSubmit }: AppointmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form with default values or existing appointment data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: appointment ? {
      customerName: appointment.customerName,
      customerEmail: appointment.customerEmail,
      customerPhone: appointment.customerPhone,
      appointmentDate: new Date(appointment.appointmentDate),
      appointmentTime: appointment.appointmentTime,
      duration: appointment.duration,
      serviceType: appointment.serviceType,
      vehicleInfo: appointment.vehicleInfo || "",
      notes: appointment.notes || "",
    } : {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      appointmentDate: new Date(),
      appointmentTime: "",
      duration: 30,
      serviceType: "",
      vehicleInfo: "",
      notes: "",
    },
  });
  
  // Get service options based on selected service type
  const getRecommendedDuration = (serviceType: string): number => {
    switch(serviceType) {
      case "TIRE_INSTALLATION":
        return 60;
      case "TIRE_ROTATION":
        return 30;
      case "WHEEL_ALIGNMENT":
        return 45;
      case "FLAT_REPAIR":
        return 30;
      case "TIRE_BALANCING":
        return 45;
      case "TIRE_INSPECTION":
        return 30;
      default:
        return 30;
    }
  };
  
  // Handle service type change to set recommended duration
  const handleServiceTypeChange = (value: string) => {
    form.setValue("serviceType", value);
    form.setValue("duration", getRecommendedDuration(value));
  };
  
  // Handle form submission
  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const success = await onSubmit(data);
      if (success) {
        form.reset();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="customerEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="john.doe@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="customerPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="(555) 123-4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="serviceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Type</FormLabel>
                <Select 
                  onValueChange={handleServiceTypeChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {serviceTypes.map((service) => (
                      <SelectItem key={service.value} value={service.value}>
                        {service.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="appointmentDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => 
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="appointmentTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time slot" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {durationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="vehicleInfo"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Vehicle Information</FormLabel>
                <FormControl>
                  <Input placeholder="E.g., 2019 Toyota Camry" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Additional Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Any special instructions or additional information" 
                    className="min-h-[100px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : appointment ? (
              "Update Appointment"
            ) : (
              "Create Appointment"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}