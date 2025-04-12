"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Car, 
  User, 
  Mail, 
  Phone, 
  FileText, 
  Check, 
  X, 
  RefreshCw, 
  Edit 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

import { AppointmentForm } from "../components/appointment-form";

// Fetch a single appointment by ID
const fetchAppointment = async (appointmentId: string) => {
  try {
    const response = await axios.get(`/api/appointments/${appointmentId}`);
    return response.data.appointment;
  } catch (error) {
    console.error(`Error fetching appointment ${appointmentId}:`, error);
    throw error;
  }
};

// Status badge component
function AppointmentStatusBadge({ status }: { status: string }) {
  let badgeStyles = "";
  let icon = null;
  
  switch(status) {
    case "SCHEDULED":
      badgeStyles = "bg-blue-100 text-blue-800 border-blue-200";
      icon = <Calendar className="h-3.5 w-3.5 mr-1" />;
      break;
    case "CONFIRMED":
      badgeStyles = "bg-green-100 text-green-800 border-green-200";
      icon = <Check className="h-3.5 w-3.5 mr-1" />;
      break;
    case "COMPLETED":
      badgeStyles = "bg-purple-100 text-purple-800 border-purple-200";
      icon = <Check className="h-3.5 w-3.5 mr-1" />;
      break;
    case "CANCELLED":
      badgeStyles = "bg-red-100 text-red-800 border-red-200";
      icon = <X className="h-3.5 w-3.5 mr-1" />;
      break;
    case "NO_SHOW":
      badgeStyles = "bg-gray-100 text-gray-800 border-gray-200";
      icon = <X className="h-3.5 w-3.5 mr-1" />;
      break;
    default:
      badgeStyles = "bg-gray-100 text-gray-800 border-gray-200";
  }
  
  return (
    <Badge variant="outline" className={`flex items-center ${badgeStyles}`}>
      {icon}
      {status === "NO_SHOW" ? "No Show" : status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}

// Service type formatter
function formatServiceType(type: string) {
  return type.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
}

export default function AppointmentDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  
  const appointmentId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  
  // React Query hook for fetching the appointment details
  const { 
    data: appointment, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ["appointment", appointmentId],
    queryFn: () => fetchAppointment(appointmentId),
    refetchOnWindowFocus: false,
    enabled: !!appointmentId, // Only run query if appointmentId exists
  });
  
  // Handle status update
  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await axios.patch(`/api/appointments/${appointmentId}`, { status: newStatus });
      toast.success("Appointment status updated successfully!");
      refetch(); // Refetch appointment details
    } catch (error) {
      console.error("Failed to update appointment status:", error);
      toast.error("Failed to update appointment status. Please try again.");
    }
  };
  
  // Handle appointment update
  const handleUpdateAppointment = async (formData: any) => {
    try {
      await axios.patch(`/api/appointments/${appointmentId}`, formData);
      toast.success("Appointment updated successfully!");
      setIsUpdateDialogOpen(false);
      refetch(); // Refetch appointment details
      return true;
    } catch (error) {
      console.error("Failed to update appointment:", error);
      toast.error("Failed to update appointment. Please try again.");
      return false;
    }
  };
  
  // Handle appointment cancellation
  const handleCancelAppointment = async () => {
    if (confirm("Are you sure you want to cancel this appointment?")) {
      try {
        await axios.delete(`/api/appointments/${appointmentId}`);
        toast.success("Appointment cancelled successfully!");
        router.push("/dashboard/appointments");
      } catch (error) {
        console.error("Failed to cancel appointment:", error);
        toast.error("Failed to cancel appointment. Please try again.");
      }
    }
  };
  
  // Go back to appointments list
  const goBack = () => {
    router.push("/dashboard/appointments");
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" onClick={goBack} className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Loading Appointment...</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (isError) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" onClick={goBack} className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Error</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-red-500">
              <p>Failed to load appointment details: {error instanceof Error ? error.message : "Unknown error"}</p>
              <Button onClick={() => refetch()} className="mt-4">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If we have appointment data, render the appointment details
  return (
    <div className="container mx-auto py-10 space-y-6">
      {/* Header with back button and actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" onClick={goBack} className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Appointment Details
            </h1>
            <p className="text-sm text-muted-foreground">
              Scheduled for {appointment ? format(new Date(appointment.appointmentDate), "MMMM d, yyyy") : ''} at {appointment?.appointmentTime}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit Appointment</DialogTitle>
                <DialogDescription>
                  Update the appointment details below.
                </DialogDescription>
              </DialogHeader>
              <AppointmentForm 
                appointment={appointment} 
                onSubmit={handleUpdateAppointment} 
              />
            </DialogContent>
          </Dialog>
          
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          
          <Button onClick={handleCancelAppointment} variant="destructive">
            <X className="mr-2 h-4 w-4" />
            Cancel Appointment
          </Button>
        </div>
      </div>
      
      {/* Appointment details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Status:</span>
                {appointment && <AppointmentStatusBadge status={appointment.status} />}
              </div>
              <Separator />
              <div className="flex flex-col space-y-2">
                <span className="text-sm font-medium">Update Status:</span>
                <div className="grid grid-cols-2 gap-2">
                  {appointment?.status === "SCHEDULED" && (
                    <Button 
                      variant="outline" 
                      className="border-green-500 text-green-600"
                      onClick={() => handleStatusUpdate("CONFIRMED")}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Confirm
                    </Button>
                  )}
                  {(appointment?.status === "SCHEDULED" || appointment?.status === "CONFIRMED") && (
                    <Button 
                      variant="outline" 
                      className="border-purple-500 text-purple-600"
                      onClick={() => handleStatusUpdate("COMPLETED")}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Complete
                    </Button>
                  )}
                  {(appointment?.status === "SCHEDULED" || appointment?.status === "CONFIRMED") && (
                    <Button 
                      variant="outline" 
                      className="border-gray-500 text-gray-600"
                      onClick={() => handleStatusUpdate("NO_SHOW")}
                    >
                      <X className="mr-2 h-4 w-4" />
                      No Show
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Customer Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex items-start">
                <User className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{appointment?.customerName}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Mail className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                <div>
                  <p>{appointment?.customerEmail}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Phone className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                <div>
                  <p>{appointment?.customerPhone}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start">
                <Car className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Vehicle Information</p>
                  <p className="text-muted-foreground">
                    {appointment?.vehicleInfo || "No vehicle information provided"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Appointment Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Appointment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Date</p>
                  <p>{appointment ? format(new Date(appointment.appointmentDate), "MMMM d, yyyy") : ''}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Clock className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Time</p>
                  <p>{appointment?.appointmentTime} ({appointment?.duration} minutes)</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="font-medium">Service Type</p>
                {appointment && (
                  <Badge className="mt-1">
                    {formatServiceType(appointment.serviceType)}
                  </Badge>
                )}
              </div>
              <Separator />
              <div className="flex items-start">
                <FileText className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Notes</p>
                  <p className="text-muted-foreground">
                    {appointment?.notes || "No additional notes"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}