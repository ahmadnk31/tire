"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  Plus,
  Search,
  Loader2,
  MoreHorizontal,
  Calendar as CalendarIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

import { AppointmentForm } from "./components/appointment-form";
import { z } from "zod";

// Type definitions
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
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AppointmentsResponse {
  appointments: Appointment[];
  pagination: PaginationData;
}

// Define the form schema for type checking
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

type FormValues = z.infer<typeof formSchema>;

// Fetch appointments with filters
const fetchAppointments = async ({ 
  page = 1, 
  limit = 10, 
  status = null,
  date = null,
  search = null 
}: {
  page?: number;
  limit?: number;
  status?: string | null;
  date?: Date | null;
  search?: string | null;
}): Promise<AppointmentsResponse> => {
  try {
    let url = `/api/appointments?page=${page}&limit=${limit}`;
    
    if (status) {
      url += `&status=${status}`;
    }
    
    if (date) {
      url += `&date=${date.toISOString()}`;
    }
    
    if (search) {
      url += `&search=${search}`;
    }
    
    const response = await axios.get<AppointmentsResponse>(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching appointments:", error);
    throw error;
  }
};

// Status badge component
function AppointmentStatusBadge({ status }: { status: string }) {
  let badgeStyles = "";
  
  switch(status) {
    case "SCHEDULED":
      badgeStyles = "bg-blue-100 text-blue-800 border-blue-200";
      break;
    case "CONFIRMED":
      badgeStyles = "bg-green-100 text-green-800 border-green-200";
      break;
    case "COMPLETED":
      badgeStyles = "bg-purple-100 text-purple-800 border-purple-200";
      break;
    case "CANCELLED":
      badgeStyles = "bg-red-100 text-red-800 border-red-200";
      break;
    case "NO_SHOW":
      badgeStyles = "bg-gray-100 text-gray-800 border-gray-200";
      break;
    default:
      badgeStyles = "bg-gray-100 text-gray-800 border-gray-200";
  }
  
  return (
    <Badge variant="outline" className={badgeStyles}>
      {status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')}
    </Badge>
  );
}

// Service type badge component
function ServiceTypeBadge({ type }: { type: string }) {
  let badgeStyles = "";
  
  switch(type) {
    case "TIRE_INSTALLATION":
      badgeStyles = "bg-purple-100 text-purple-800";
      break;
    case "TIRE_ROTATION":
      badgeStyles = "bg-blue-100 text-blue-800";
      break;
    case "WHEEL_ALIGNMENT":
      badgeStyles = "bg-amber-100 text-amber-800";
      break;
    case "FLAT_REPAIR":
      badgeStyles = "bg-red-100 text-red-800";
      break;
    case "TIRE_BALANCING":
      badgeStyles = "bg-green-100 text-green-800";
      break;
    case "TIRE_INSPECTION":
      badgeStyles = "bg-indigo-100 text-indigo-800";
      break;
    case "OTHER":
      badgeStyles = "bg-gray-100 text-gray-800";
      break;
    default:
      badgeStyles = "bg-gray-100 text-gray-800";
  }
  
  return (
    <Badge className={badgeStyles}>
      {type.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
    </Badge>
  );
}

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

export function AppointmentsPageContent() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("upcoming");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  
  // Format for API query
  const formattedDate = dateFilter ? dateFilter.toISOString().split('T')[0] : null;
  
  // React Query hook for fetching appointments
  const { 
    data, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ["appointments", page, limit, statusFilter, formattedDate, searchQuery],
    queryFn: () => fetchAppointments({ 
      page, 
      limit, 
      status: statusFilter !== "all" ? statusFilter : null,
      date: dateFilter,
      search: searchQuery || null
    }),
    refetchOnWindowFocus: false,
  });
  
  // Handle appointment status update
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await axios.patch(`/api/appointments/${id}`, { status: newStatus });
      toast.success("Appointment status updated successfully");
      refetch();
    } catch (error) {
      console.error("Failed to update appointment status:", error);
      toast.error("Failed to update appointment status");
    }
  };
  
  // Handle appointment delete/cancel
  const handleCancelAppointment = async (id: string) => {
    try {
      await axios.delete(`/api/appointments/${id}`);
      toast.success("Appointment cancelled successfully");
      refetch();
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
      toast.error("Failed to cancel appointment");
    }
  };
  
  // Handle form submission for creating appointment
  const handleCreateAppointment = async (formData: FormValues): Promise<boolean> => {
    try {
      const response = await axios.post('/api/appointments', formData);
      toast.success("Appointment created successfully");
      setIsCreateDialogOpen(false);
      refetch();
      return true;
    } catch (error) {
      console.error("Failed to create appointment:", error);
      toast.error("Failed to create appointment");
      return false;
    }
  };
  
  // Dashboard stats calculation
  const todayAppointments = data?.appointments?.filter(appointment => {
    const appointmentDate = new Date(appointment.appointmentDate);
    const today = new Date();
    return (
      appointmentDate.getDate() === today.getDate() &&
      appointmentDate.getMonth() === today.getMonth() &&
      appointmentDate.getFullYear() === today.getFullYear()
    );
  }) || [];
  
  const upcomingAppointments = data?.appointments?.filter(appointment => {
    return appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED";
  }) || [];
  
  const completedAppointments = data?.appointments?.filter(appointment => {
    return appointment.status === "COMPLETED";
  }) || [];
  
  const cancelledAppointments = data?.appointments?.filter(appointment => {
    return appointment.status === "CANCELLED" || appointment.status === "NO_SHOW";
  }) || [];
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
        <p className="text-muted-foreground">
          Manage customer service appointments for your tire shop.
        </p>
      </div>
      
      {/* Dashboard stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : todayAppointments.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Appointments scheduled for today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : upcomingAppointments.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Scheduled and confirmed appointments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : completedAppointments.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Completed appointments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : cancelledAppointments.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Cancelled or no-show appointments
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs and filters */}
      <Card>
        <CardHeader className="p-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Appointments</CardTitle>
            <CardDescription>
              View and manage all customer appointments
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Appointment</DialogTitle>
                <DialogDescription>
                  Fill out the form below to create a new customer appointment.
                </DialogDescription>
              </DialogHeader>
              <AppointmentForm 
                onSubmit={async (data) => {
                  const result = await handleCreateAppointment(data);
                  return result; // Returns true/false to the AppointmentForm
                }} 
                appointment={undefined}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        
        <Separator />
        
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search appointments..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-row items-center space-x-2 w-full md:w-auto">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="NO_SHOW">No Show</SelectItem>
                </SelectContent>
              </Select>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full md:w-[240px] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFilter ? (
                      format(dateFilter, "PPP")
                    ) : (
                      <span>Filter by date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateFilter || undefined}
                    onSelect={(date: Date | undefined) => setDateFilter(date || null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              {(dateFilter || statusFilter !== "all" || searchQuery) && (
                <Button
                  variant="ghost"
                  className="h-8 px-2"
                  onClick={() => {
                    setDateFilter(null);
                    setStatusFilter("all");
                    setSearchQuery("");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          </div>
          
          {/* Appointments table */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : isError ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-red-500">Error loading appointments: {error instanceof Error ? error.message : "Unknown error"}</div>
            </div>
          ) : data?.appointments?.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-muted-foreground">No appointments found</div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.appointments?.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="font-medium">{appointment.customerName}</div>
                        <div className="text-sm text-muted-foreground">
                          {appointment.customerEmail}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ServiceTypeBadge type={appointment.serviceType} />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {format(new Date(appointment.appointmentDate), "MMM d, yyyy")}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {appointment.appointmentTime} ({appointment.duration} mins)
                        </div>
                      </TableCell>
                      <TableCell>
                        <AppointmentStatusBadge status={appointment.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => window.location.href = `/dashboard/appointments/${appointment.id}`}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {appointment.status === "SCHEDULED" && (
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(appointment.id, "CONFIRMED")}
                              >
                                Confirm
                              </DropdownMenuItem>
                            )}
                            {(appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED") && (
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(appointment.id, "COMPLETED")}
                              >
                                Mark as Completed
                              </DropdownMenuItem>
                            )}
                            {(appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED") && (
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(appointment.id, "NO_SHOW")}
                              >
                                Mark as No-Show
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleCancelAppointment(appointment.id)}
                            >
                              Cancel
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => page > 1 && setPage(page - 1)}
                          className={page === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1)
                        .filter(p => {
                          // Show first page, last page, current page, and pages around current page
                          return (
                            p === 1 || 
                            p === data.pagination.totalPages || 
                            (p >= page - 1 && p <= page + 1)
                          );
                        })
                        .map((p, i, arr) => {
                          // If there's a gap, add ellipsis
                          if (i > 0 && p > arr[i - 1] + 1) {
                            return (
                              <PaginationItem key={`ellipsis-${p}`}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          
                          return (
                            <PaginationItem key={p}>
                              <PaginationLink
                                isActive={page === p}
                                onClick={() => setPage(p)}
                              >
                                {p}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => page < data.pagination.totalPages && setPage(page + 1)}
                          className={page === data.pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}