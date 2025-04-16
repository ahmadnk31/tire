"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { InstallationAdditionalServices, AdditionalService } from "@/components/dashboard/installations/installation-additional-services";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";


interface NewInstallationFormProps {
  locale: string;
}

export function NewInstallationForm({ locale }: NewInstallationFormProps) {
  const t = useTranslations("Dashboard.installations");
  const router = useRouter();
  
  // State for additional services
  const [additionalServices, setAdditionalServices] = useState<AdditionalService[]>([]);
  
  // Handle changes to additional services
  const handleServicesChange = (services: AdditionalService[]) => {
    setAdditionalServices(services);
  };
    // Handle form submission
  const handleSubmit = async () => {
    try {
      // Show loading state
      const loadingToast = toast.loading(t("form.creating"));
      
      // First, create the installation
      const installationResponse = await fetch('/api/installations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Add any other installation fields here
          basePrice: 0, // Start with base price of 0
          status: 'PENDING',
          totalPrice: 0, // Will be calculated after adding services
        }),
      });
      
      if (!installationResponse.ok) {
        throw new Error(`Failed to create installation: ${installationResponse.status}`);
      }
      
      const installation = await installationResponse.json();
      
      // Add each additional service to the newly created installation
      if (additionalServices.length > 0) {
        const servicesResponse = await fetch(`/api/installations/${installation.id}/additional-services`, {
          method: 'PUT', // Use PUT to replace all services
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(additionalServices.map(service => ({
            serviceName: service.serviceName,
            price: service.price,
          }))),
        });
        
        if (!servicesResponse.ok) {
          throw new Error(`Failed to add additional services: ${servicesResponse.status}`);
        }
      }
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Show success message
      toast.success(t("form.createSuccess"));
      
      // Redirect to the newly created installation
      router.push(`/${locale}/dashboard/installations/${installation.id}`);
    } catch (error) {
      console.error("Error creating installation:", error);
      toast.error(t("form.createError"));
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    router.push(`/${locale}/dashboard/installations`);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("form.createTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* You can add more form fields here for the installation */}
          
          {/* Additional services section */}
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">{t("additionalServices.title")}</h3>
            <InstallationAdditionalServices 
              initialServices={additionalServices}
              onServicesChange={handleServicesChange}
            />
          </div>
          
          {/* Form actions */}
          <div className="flex justify-end gap-4 mt-8">
            <Button variant="outline" onClick={handleCancel}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSubmit}>
              {t("form.create")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
