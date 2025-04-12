import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import axios from "axios";
import { Mail, BellRing, CheckCircle2, Clock, CalendarDays, RefreshCw } from "lucide-react";
import { toast } from 'sonner';
import { Appointment } from '@prisma/client';

type EmailResult = {
  customerEmail: string;
  successful: number;
    failed: number;
    total: number;
    date: string;
    results: {
      customerEmail: string;
      success: boolean;
      error?: string;
    }[];
};

export default function AppointmentReminders() {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState("1");
  const [reminderType, setReminderType] = useState("upcoming");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [emailResults, setEmailResults] = useState<EmailResult | null>(null);


  // Format appointment status for display
  const formatStatus = (status: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined) => {
    switch(status) {
      case 'SCHEDULED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Scheduled</Badge>;
      case 'CONFIRMED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Confirmed</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      case 'NO_SHOW':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">No Show</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format service type for display
  const formatServiceType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Fetch upcoming appointments that need reminders
  const fetchAppointmentsForReminders = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/appointments/reminders?days=${selectedDays}&onlyScheduled=${reminderType === 'upcoming'}`);
      setAppointments(response.data.appointments || []);
      toast.success(`Loaded ${response.data.total} appointments for reminders`);
    } catch (error) {
      console.error("Error fetching appointments for reminders:", error);
      toast.error("Failed to load appointments. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Send reminder emails to all loaded appointments
  const sendReminderEmails = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`/api/appointments/reminders?days=${selectedDays}&onlyScheduled=${reminderType === 'upcoming'}`);
      setEmailResults(response.data);
      setIsEmailDialogOpen(true);
      toast.success(`Sent ${response.data.successful} reminder emails`);
    } catch (error) {
      console.error("Error sending reminder emails:", error);
      toast.error("Failed to send reminder emails. Please try again.");
      setEmailResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle email dialog close
  const handleEmailDialogClose = () => {
    setIsEmailDialogOpen(false);
    setEmailResults(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5" />
          Appointment Reminders
        </CardTitle>
        <CardDescription>
          Send reminder emails for upcoming appointments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="days">Remind for appointments in:</Label>
              <Select
                value={selectedDays}
                onValueChange={setSelectedDays}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Today</SelectItem>
                  <SelectItem value="1">Tomorrow</SelectItem>
                  <SelectItem value="2">In 2 days</SelectItem>
                  <SelectItem value="3">In 3 days</SelectItem>
                  <SelectItem value="7">In a week</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Appointment type:</Label>
              <Select
                value={reminderType}
                onValueChange={setReminderType}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming only</SelectItem>
                  <SelectItem value="all">All appointments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    onClick={fetchAppointmentsForReminders}
                    disabled={isLoading}
                    className="ml-auto"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Loading...' : 'Refresh'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Load appointments based on selected criteria</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button 
              onClick={sendReminderEmails}
              disabled={isLoading || appointments.length === 0}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Reminders
            </Button>
          </div>

          <div className="border rounded-lg">
            {appointments.length > 0 ? (
              <ScrollArea className="h-80">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div className="font-medium">{appointment.customerName}</div>
                          <div className="text-sm text-muted-foreground">{appointment.customerEmail}</div>
                        </TableCell>
                        <TableCell>{formatServiceType(appointment.serviceType)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <CalendarDays className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span>{format(new Date(appointment.appointmentDate), 'MMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{appointment.appointmentTime}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatStatus(appointment.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center p-4">
                <Clock className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No appointments found</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {isLoading ? 
                    "Loading appointments..." : 
                    "Click the refresh button to load appointments based on your selection."}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Email Results Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={handleEmailDialogClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Reminder Results
            </DialogTitle>
            <DialogDescription>
              Summary of email reminder sending operation
            </DialogDescription>
          </DialogHeader>
          
          {emailResults && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{emailResults.successful}</div>
                  <div className="text-sm text-muted-foreground">Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{emailResults.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{emailResults.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
              
              <div className="border rounded-md p-3 bg-muted/50">
                <div className="font-medium mb-2">Target Date</div>
                <div className="flex items-center">
                  <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                  {format(new Date(emailResults.date), 'MMMM d, yyyy')}
                </div>
              </div>
              
              {emailResults.failed > 0 && (
                <div>
                  <div className="font-medium mb-2 text-red-600">Failures</div>
                  <ScrollArea className="h-40">
                    <div className="space-y-2">
                      {emailResults.results.filter(r => !r.success).map((result, index) => (
                        <div key={index} className="text-sm border border-red-200 rounded-md p-2 bg-red-50">
                          <div><strong>Email:</strong> {result.customerEmail}</div>
                          <div><strong>Error:</strong> {result.error}</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={handleEmailDialogClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}