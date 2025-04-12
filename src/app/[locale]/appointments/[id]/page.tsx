"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import axios from "axios";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Car,
  FileText,
  ArrowLeft,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// Define appointment type
interface Appointment {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  serviceType: string;
  vehicleInfo?: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function AppointmentDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: session, status } = useSession();
  
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  let appointmentId: string | undefined = undefined;
  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/appointments");
    }
  }, [status, router]);
  // Fetch appointment details
  const fetchAppointmentDetails = async () => {
    if (status !== "authenticated") return;
    
    setIsLoading(true);
    
    try {
      const { id } = await params;
      appointmentId = id;
      const response = await axios.get(`/api/appointments/${appointmentId}`);
      // Extract the appointment object from the response data
      setAppointment(response.data.appointment);
    } catch (error) {
      console.error("Error fetching appointment details:", error);
      toast.error("Failed to load appointment details");
      router.push("/appointments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchAppointmentDetails();
    }
  }, [status, appointmentId]);

  // Handle appointment cancellation
  const handleCancelAppointment = async () => {
    try {
      await axios.patch(`/api/appointments/${appointmentId}`, { status: "CANCELLED" });
      toast.success("Appointment cancelled successfully");
      setIsCancelDialogOpen(false);
      fetchAppointmentDetails();
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
      toast.error("Failed to cancel appointment");
    }
  };

  // Render appointment status badge
  const AppointmentStatusBadge = ({ status }: { status: string }) => {
    let badgeVariant = "";
    
    switch(status) {
      case "SCHEDULED":
        badgeVariant = "bg-blue-100 text-blue-800 border-blue-200";
        break;
      case "CONFIRMED":
        badgeVariant = "bg-green-100 text-green-800 border-green-200";
        break;
      case "COMPLETED":
        badgeVariant = "bg-purple-100 text-purple-800 border-purple-200";
        break;
      case "CANCELLED":
        badgeVariant = "bg-red-100 text-red-800 border-red-200";
        break;
      case "NO_SHOW":
        badgeVariant = "bg-gray-100 text-gray-800 border-gray-200";
        break;
      default:
        badgeVariant = "bg-gray-100 text-gray-800 border-gray-200";
    }
    
    return (
      <Badge variant="outline" className={badgeVariant}>
        {status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')}
      </Badge>
    );
  };
  // Get friendly service type name
  const getServiceTypeName = (type: string | undefined) => {
    if (!type) return 'Unknown Service';
    return type.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  // Loading skeleton
  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return (
      <div className="container mx-auto py-10 max-w-3xl space-y-6">
        <div className="flex flex-col space-y-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  // Show login message if not authenticated
  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto py-10 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
            <CardDescription>
              Please log in to view and manage your appointments.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/login?callbackUrl=/appointments")}>
              Log In
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show error message if appointment not found
  if (!appointment) {
    return (
      <div className="container mx-auto py-10 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Appointment Not Found</CardTitle>
            <CardDescription>
              The appointment you are looking for does not exist or you don't have permission to view it.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/appointments")}>
              Back to Appointments
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-3xl space-y-6">
      <Button 
        variant="outline" 
        onClick={() => router.push("/appointments")}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Appointments
      </Button>
      
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">{getServiceTypeName(appointment.serviceType)}</CardTitle>
              <CardDescription className="mt-1">
                Appointment #{appointment?.id?.substring(0, 8).toUpperCase()}
              </CardDescription>
            </div>
            <AppointmentStatusBadge status={appointment.status} />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground">Date & Time</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{format(new Date(appointment.appointmentDate), "MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>{appointment.appointmentTime} ({appointment.duration} minutes)</span>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>{appointment.customerEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>{appointment.customerPhone}</span>
              </div>
            </div>
          </div>
          
          {appointment.vehicleInfo && (
            <>
              <Separator />
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Vehicle Information</h3>
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-primary" />
                  <span>{appointment.vehicleInfo}</span>
                </div>
              </div>
            </>
          )}
          
          {appointment.notes && (
            <>
              <Separator />
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Additional Notes</h3>
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-primary mt-0.5" />
                  <span>{appointment.notes}</span>
                </div>
              </div>
            </>
          )}
          
          <Separator />
          
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground">Appointment Status</h3>
            <div className="text-sm">
              {appointment.status === "SCHEDULED" && (
                <p>
                  Your appointment is scheduled. You will receive a confirmation
                  email shortly before your appointment.
                </p>
              )}
              {appointment.status === "CONFIRMED" && (
                <p>
                  Your appointment has been confirmed. Please arrive 10-15 minutes 
                  before your scheduled time.
                </p>
              )}
              {appointment.status === "COMPLETED" && (
                <p>
                  Your appointment has been completed. Thank you for choosing our services!
                </p>
              )}
              {appointment.status === "CANCELLED" && (
                <p>
                  This appointment has been cancelled. You can book a new appointment
                  from the appointments page.
                </p>
              )}
              {appointment.status === "NO_SHOW" && (
                <p>
                  You did not arrive for this appointment. Please book a new appointment
                  if you still need our services.
                </p>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={() => router.push("/appointments")}>
            Back to All Appointments
          </Button>
          
          {(appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED") && (
            <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">Cancel Appointment</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel Appointment</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to cancel this appointment? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
                    No, Keep Appointment
                  </Button>
                  <Button variant="destructive" onClick={handleCancelAppointment}>
                    Yes, Cancel Appointment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}