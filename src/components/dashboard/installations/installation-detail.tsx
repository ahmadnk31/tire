"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useInstallation, useUpdateInstallationStatus } from "@/hooks/use-installations";
import { Installation, InstallationStatus } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  PencilIcon,
  PlayIcon,
  TruckIcon,
  XIcon,
} from "lucide-react";

interface InstallationDetailProps {
  initialData: any;
  id: string;
}

export function InstallationDetail({ initialData, id }: InstallationDetailProps) {
  const t = useTranslations("Dashboard.installations");
  const router = useRouter();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [statusToConfirm, setStatusToConfirm] = useState<InstallationStatus | null>(null);

  // Use TanStack Query to fetch the latest data
  const { data, isLoading, error } = useInstallation(id);
  const { mutate: updateStatus, isPending } = useUpdateInstallationStatus();

  // Use initialData if data is not yet loaded
  const installation = data || initialData;

  const handleStatusUpdate = (status: InstallationStatus) => {
    setStatusToConfirm(status);
    setIsConfirmDialogOpen(true);
  };

  const confirmStatusUpdate = () => {
    if (!statusToConfirm) return;
    
    updateStatus(
      { id, status: statusToConfirm },
      {
        onSuccess: () => {
          setIsConfirmDialogOpen(false);
          setStatusToConfirm(null);
        },
        onError: () => {
          setIsConfirmDialogOpen(false);
          setStatusToConfirm(null);
        },
      }
    );
  };

  const getStatusBadge = (status: InstallationStatus) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge variant="outline">{t("tabs.scheduled")}</Badge>;
      case 'CONFIRMED':
        return <Badge variant="secondary">{t("tabs.confirmed")}</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="default">{t("tabs.inProgress")}</Badge>;
      case 'COMPLETED':
        return <Badge variant="default">{t("tabs.completed")}</Badge>;
      case 'CANCELED':
        return <Badge variant="destructive">{t("tabs.canceled")}</Badge>;
      case 'RESCHEDULED':
        return <Badge variant="default">{t("tabs.rescheduled")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()} className="gap-2">
          <ArrowLeftIcon className="h-4 w-4" />
          {t("detail.backToList")}
        </Button>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/dashboard/installations/${id}/edit`)}
            className="gap-2"
          >
            <PencilIcon className="h-4 w-4" />
            {t("actions.edit")}
          </Button>
          
          {/* Status update buttons - show relevant ones based on current status */}
          {installation.status === InstallationStatus.SCHEDULED && (
            <Button 
              onClick={() => handleStatusUpdate(InstallationStatus.CONFIRMED)}
              className="gap-2"
            >
              <CheckIcon className="h-4 w-4" />
              {t("actions.confirm")}
            </Button>
          )}
          
          {installation.status === InstallationStatus.CONFIRMED && (
            <Button 
              onClick={() => handleStatusUpdate(InstallationStatus.IN_PROGRESS)}
              className="gap-2"
            >
              <PlayIcon className="h-4 w-4" />
              {t("actions.startWork")}
            </Button>
          )}
          
          {installation.status === InstallationStatus.IN_PROGRESS && (
            <Button 
              onClick={() => handleStatusUpdate(InstallationStatus.COMPLETED)}
              variant="default"
              className="gap-2"
            >
              <CheckIcon className="h-4 w-4" />
              {t("actions.complete")}
            </Button>
          )}
          
          {(installation.status === InstallationStatus.SCHEDULED || 
           installation.status === InstallationStatus.CONFIRMED) && (
            <Button 
              onClick={() => handleStatusUpdate(InstallationStatus.CANCELED)}
              variant="destructive"
              className="gap-2"
            >
              <XIcon className="h-4 w-4" />
              {t("actions.cancel")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("detail.appointmentDetails")}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(installation.status)}
              <span className="text-sm text-muted-foreground">ID: #{installation.id.slice(-6)}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">{t("detail.serviceType")}</div>
                <div>{t(`serviceType.${installation.serviceType}`)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">{t("detail.price")}</div>
                <div>${installation.totalPrice.toFixed(2)}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(installation.appointmentDate), "PPP")}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
              <span>{installation.appointmentTime}</span>
            </div>
            
            {installation.technician && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">{t("detail.technician")}</div>
                <div>{installation.technician}</div>
              </div>
            )}
            
            {installation.bay && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">{t("detail.bay")}</div>
                <div>{installation.bay}</div>
              </div>
            )}
            
            {installation.completedDate && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">{t("detail.completedDate")}</div>
                <div>{format(new Date(installation.completedDate), "PPP p")}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("detail.customerInformation")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">{t("detail.customerName")}</div>
              <div>{installation.customerName}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-muted-foreground">{t("detail.email")}</div>
              <div>{installation.customerEmail}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-muted-foreground">{t("detail.phone")}</div>
              <div>{installation.customerPhone}</div>
            </div>
            
            {installation.userId && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">{t("detail.account")}</div>
                <div>
                  <Badge variant="secondary">{t("detail.registeredUser")}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("detail.vehicleInformation")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">{t("detail.vehicle")}</div>
              <div>
                {installation.vehicleYear} {installation.vehicleMake} {installation.vehicleModel}
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-muted-foreground">{t("detail.tireSize")}</div>
              <div>{installation.tireSize}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-muted-foreground">{t("detail.tireQuantity")}</div>
              <div>{installation.tireQuantity} {t("detail.tires")}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-muted-foreground">{t("detail.purchasedFrom")}</div>
              <div>
                {installation.purchasedFrom === "OUR_STORE" 
                  ? t("detail.purchasedFromUs")
                  : t("detail.purchasedElsewhere")}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("detail.pricing")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">{t("detail.basePrice")}</div>
              <div>${installation.basePrice.toFixed(2)}</div>
            </div>
            
            {installation.additionalServices.length > 0 && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">{t("detail.additionalServices")}</div>
                <ul className="mt-2 space-y-2">
                  {installation.additionalServices.map((service: any) => (
                    <li key={service.id} className="flex justify-between text-sm">
                      <span>{service.serviceName}</span>
                      <span>${service.price.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-between font-medium">
              <span>{t("detail.totalPrice")}</span>
              <span>${installation.totalPrice.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {installation.comments && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{t("detail.comments")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{installation.comments}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusToConfirm === InstallationStatus.CANCELED
                ? t("confirmDialog.cancelTitle")
                : t("confirmDialog.updateStatusTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusToConfirm === InstallationStatus.CANCELED
                ? t("confirmDialog.cancelDescription")
                : t("confirmDialog.updateStatusDescription", {
                    status: t(`status.${statusToConfirm?.toLowerCase() || ''}`),
                  })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              {t("confirmDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusUpdate} disabled={isPending}>
              {isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
              ) : null}
              {statusToConfirm === InstallationStatus.CANCELED
                ? t("confirmDialog.confirmCancel")
                : t("confirmDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
