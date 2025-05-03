"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { enUS, nl } from "date-fns/locale";
import axios from "axios";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Calendar,
  Clock,
  Plus,
  Settings,
  ArrowRight,
  Calendar as CalendarIcon,
  List,
  Globe,
} from "lucide-react";
import { AppointmentForm } from "./components/appointment-form";

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

// Status badge component
function AppointmentStatusBadge({ status }: { status: string }) {
  const t = useTranslations("appointments");
  let badgeVariant = "";

  switch (status) {
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
    <Badge variant='outline' className={badgeVariant}>
      {t(`status.${status.toLowerCase()}`)}
    </Badge>
  );
}

// Language switcher component
function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";

  const switchLanguage = () => {
    // Simple language toggle
    const newLocale = locale === "en" ? "nl" : "en";

    // Extract the path without locale prefix if it exists
    const pathWithoutLocale = pathname.replace(/^\/(en|nl)/, "") || "/";

    // Construct and navigate to the new path
    router.push(`/${newLocale}${pathWithoutLocale}`);
  };

  return (
    <Button variant='outline' size='sm' onClick={switchLanguage}>
      <Globe className='h-4 w-4 mr-2' />
      {locale === "en" ? "Nederlands" : "English"}
    </Button>
  );
}

// Localized date formatter
function LocalizedDate({
  dateString,
  formatPattern = "MMM d, yyyy",
}: {
  dateString: string;
  formatPattern?: string;
}) {
  const locale = useLocale();
  const localeObj = locale === "nl" ? nl : enUS;

  return format(new Date(dateString), formatPattern, { locale: localeObj });
}

export default function AppointmentsPage() {
  const t = useTranslations("appointments");
  const locale = useLocale();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "all">(
    "upcoming"
  );

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/login?callbackUrl=/${locale}/appointments`);
    }
  }, [status, router, locale]);

  // Fetch user appointments
  const fetchAppointments = async () => {
    if (status !== "authenticated") return;

    setIsLoading(true);
    try {
      const response = await axios.get("/api/appointments");
      setAppointments(response.data.appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error(t("notifications.loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  // Load appointments on page load
  useEffect(() => {
    if (status === "authenticated") {
      fetchAppointments();
    }
  }, [status]);

  // Handle appointment creation
  const handleCreateAppointment = async (formData: any) => {
    try {
      await axios.post("/api/appointments", formData);
      toast.success(t("notifications.bookSuccess"));
      setIsCreateDialogOpen(false);
      fetchAppointments();
      return true;
    } catch (error) {
      console.error("Failed to book appointment:", error);
      toast.error(t("notifications.bookError"));
      return false;
    }
  };

  // Filter appointments based on active tab
  const filteredAppointments = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (activeTab === "upcoming") {
      return (
        appointmentDate >= today &&
        (appointment.status === "SCHEDULED" ||
          appointment.status === "CONFIRMED")
      );
    } else if (activeTab === "past") {
      return (
        appointmentDate < today ||
        appointment.status === "COMPLETED" ||
        appointment.status === "CANCELLED" ||
        appointment.status === "NO_SHOW"
      );
    }
    return true; // "all" tab
  });

  // If loading or not authenticated, show loading state
  if (isLoading || status !== "authenticated") {
    return (
      <div className='container mx-auto px-4 sm:px-6 py-8 sm:py-10 lg:py-12 max-w-6xl'>
        <div className='flex flex-col gap-4'>
          <div className='flex justify-between items-center'>
            <h1 className='text-3xl font-bold'>{t("title")}</h1>
          </div>
          <p className='text-muted-foreground'>{t("loading")}</p>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4'>
            {[1, 2, 3].map((item) => (
              <Card key={item} className='animate-pulse'>
                <CardHeader className='bg-gray-100 h-16'></CardHeader>
                <CardContent className='py-6'>
                  <div className='space-y-2'>
                    <div className='bg-gray-100 h-4 w-3/4 rounded'></div>
                    <div className='bg-gray-100 h-4 w-1/2 rounded'></div>
                    <div className='bg-gray-100 h-4 w-2/3 rounded'></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 sm:px-6 py-8 sm:py-10 lg:py-12 max-w-6xl'>
      <div className='flex flex-col gap-4'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <div>
            <div className='flex items-center gap-4'>
              <h1 className='text-3xl font-bold'>{t("title")}</h1>
              <LanguageSwitcher />
            </div>
            <p className='text-muted-foreground'>{t("description")}</p>
          </div>

          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />
            {t("newButton")}
          </Button>
        </div>

        <Tabs
          defaultValue='upcoming'
          onValueChange={(value) => setActiveTab(value as any)}
        >
          <TabsList className='grid grid-cols-3 w-full md:w-auto'>
            <TabsTrigger value='upcoming'>{t("tabs.upcoming")}</TabsTrigger>
            <TabsTrigger value='past'>{t("tabs.past")}</TabsTrigger>
            <TabsTrigger value='all'>{t("tabs.all")}</TabsTrigger>
          </TabsList>

          <TabsContent value='upcoming' className='mt-6'>
            {filteredAppointments.length === 0 ? (
              <div className='text-center py-10'>
                <div className='inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4'>
                  <Calendar className='h-6 w-6' />
                </div>
                <h3 className='text-lg font-semibold'>
                  {t("emptyStates.upcoming.title")}
                </h3>
                <p className='text-muted-foreground mt-2 mb-4 max-w-md mx-auto'>
                  {t("emptyStates.upcoming.description")}
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  {t("emptyStates.upcoming.button")}
                </Button>
              </div>
            ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
                {filteredAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onRefresh={fetchAppointments}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value='past' className='mt-6'>
            {filteredAppointments.length === 0 ? (
              <div className='text-center py-10'>
                <div className='inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4'>
                  <Clock className='h-6 w-6' />
                </div>
                <h3 className='text-lg font-semibold'>
                  {t("emptyStates.past.title")}
                </h3>
                <p className='text-muted-foreground mt-2 max-w-md mx-auto'>
                  {t("emptyStates.past.description")}
                </p>
              </div>
            ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
                {filteredAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onRefresh={fetchAppointments}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value='all' className='mt-6'>
            {appointments.length === 0 ? (
              <div className='text-center py-10'>
                <div className='inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4'>
                  <Settings className='h-6 w-6' />
                </div>
                <h3 className='text-lg font-semibold'>
                  {t("emptyStates.all.title")}
                </h3>
                <p className='text-muted-foreground mt-2 mb-4 max-w-md mx-auto'>
                  {t("emptyStates.all.description")}
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  {t("emptyStates.all.button")}
                </Button>
              </div>
            ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
                {filteredAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onRefresh={fetchAppointments}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Book Appointment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className='sm:max-w-[800px] max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{t("dialog.title")}</DialogTitle>
            <DialogDescription>{t("dialog.description")}</DialogDescription>
          </DialogHeader>
          <AppointmentForm
            onSubmit={handleCreateAppointment}
            user={session?.user as any}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Appointment Card Component
function AppointmentCard({
  appointment,
  onRefresh,
}: {
  appointment: Appointment;
  onRefresh: () => void;
}) {
  const t = useTranslations("appointments");
  const router = useRouter();
  const locale = useLocale();

  const isCancellable =
    appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED";

  // Check if appointment is expired (in the past)
  const isExpired = new Date(appointment.appointmentDate) < new Date();

  const handleCancel = async () => {
    if (!window.confirm(t("card.cancelConfirm"))) return;

    try {
      await axios.patch(`/api/appointments/${appointment.id}`, {
        status: "CANCELLED",
      });
      toast.success(t("notifications.cancelSuccess"));
      onRefresh();
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
      toast.error(t("notifications.cancelError"));
    }
  };

  return (
    <Card className='w-full h-full flex flex-col'>
      <CardHeader
        className={`pb-3 ${
          isExpired &&
          appointment.status !== "CANCELLED" &&
          appointment.status !== "COMPLETED" &&
          appointment.status !== "NO_SHOW"
            ? "bg-amber-50"
            : ""
        }`}
      >
        <div className='flex justify-between items-start flex-wrap gap-2'>
          <div className='flex-1 min-w-0'>
            <CardTitle className='text-lg line-clamp-2 break-words'>
              {t(`serviceTypes.${appointment.serviceType}`)}
            </CardTitle>
            <CardDescription className='mt-1 flex flex-wrap items-center gap-1'>
              <span className='inline-flex items-center'>
                <CalendarIcon className='h-3 w-3 mr-1 flex-shrink-0' />
                <LocalizedDate dateString={appointment.appointmentDate} />
              </span>
              <span>•</span>
              <span className='inline-flex items-center'>
                <Clock className='h-3 w-3 mr-1 flex-shrink-0' />
                {appointment.appointmentTime}
              </span>
            </CardDescription>
          </div>
          <div className='flex-shrink-0'>
            <AppointmentStatusBadge status={appointment.status} />
            {isExpired &&
              appointment.status !== "CANCELLED" &&
              appointment.status !== "COMPLETED" &&
              appointment.status !== "NO_SHOW" && (
                <div className='mt-1 text-xs text-amber-600 font-medium'>
                  {t("card.expired")}
                </div>
              )}
          </div>
        </div>
      </CardHeader>
      <CardContent className='pb-3 flex-grow overflow-hidden'>
        <div className='flex flex-col text-sm text-muted-foreground gap-1'>
          <div className='flex items-center gap-2 flex-wrap'>
            <span>
              {t("card.duration", { duration: appointment.duration })}
            </span>
            {appointment.vehicleInfo && (
              <>
                <span className='text-muted'>•</span>
                <span className='truncate max-w-full'>
                  {appointment.vehicleInfo}
                </span>
              </>
            )}
          </div>
          {appointment.notes && (
            <div className='mt-2 text-sm text-muted-foreground line-clamp-2 break-words'>
              {appointment.notes}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className='flex flex-col sm:flex-row w-full gap-2 pt-2 mt-auto'>
        <Button
          variant='outline'
          className='w-full'
          onClick={() =>
            router.push(`/${locale}/appointments/${appointment.id}`)
          }
        >
          {t("card.viewButton")}
        </Button>
        {isCancellable && !isExpired && (
          <Button
            variant='destructive'
            className='w-full'
            onClick={handleCancel}
          >
            {t("card.cancelButton")}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
