"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PlusCircle, Trash2, Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface AdditionalService {
  id: string;
  installationId?: string;
  serviceName: string;
  price: number;
}

interface InstallationAdditionalServicesProps {
  initialServices: AdditionalService[];
  onServicesChange: (services: AdditionalService[]) => void;
  disabled?: boolean;
}

export function InstallationAdditionalServices({
  initialServices,
  onServicesChange,
  disabled = false
}: InstallationAdditionalServicesProps) {
  const t = useTranslations("Dashboard.installations");
  const [services, setServices] = useState<AdditionalService[]>(initialServices);
  const [newService, setNewService] = useState<Partial<AdditionalService>>({
    serviceName: "",
    price: 0
  });
  const [editingService, setEditingService] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AdditionalService>>({});

  // Handle adding a new service
  const handleAddService = () => {
    if (!newService.serviceName || !newService.price) {
      return; // Don't add empty services
    }

    const serviceToAdd = {
      id: `temp_${Date.now()}`, // Temporary ID until saved to database
      serviceName: newService.serviceName,
      price: Number(newService.price)
    };

    const updatedServices = [...services, serviceToAdd];
    setServices(updatedServices);
    onServicesChange(updatedServices);
    setNewService({ serviceName: "", price: 0 }); // Reset form
  };

  // Handle removing a service
  const handleRemoveService = (id: string) => {
    const updatedServices = services.filter(service => service.id !== id);
    setServices(updatedServices);
    onServicesChange(updatedServices);
  };

  // Start editing a service
  const handleStartEdit = (service: AdditionalService) => {
    setEditingService(service.id);
    setEditForm({
      serviceName: service.serviceName,
      price: service.price
    });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingService(null);
    setEditForm({});
  };

  // Save edited service
  const handleSaveEdit = (id: string) => {
    if (!editForm.serviceName || !editForm.price) {
      return; // Don't save invalid edits
    }

    const updatedServices = services.map(service => 
      service.id === id 
        ? { 
            ...service, 
            serviceName: editForm.serviceName as string, 
            price: Number(editForm.price) 
          } 
        : service
    );

    setServices(updatedServices);
    onServicesChange(updatedServices);
    setEditingService(null);
    setEditForm({});
  };

  // Calculate total price of additional services
  const totalAdditionalPrice = services.reduce((sum, service) => sum + service.price, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("form.additionalServices")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* List of current services */}
          {services.length > 0 ? (
            <div className="space-y-2">
              {services.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-2 border rounded-md">
                  {editingService === service.id ? (
                    <div className="flex flex-1 gap-2">
                      <div className="flex-1">
                        <Input 
                          value={editForm.serviceName} 
                          onChange={(e) => setEditForm({...editForm, serviceName: e.target.value})} 
                          placeholder={t("form.serviceName")}
                        />
                      </div>
                      <div className="w-24">
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          value={editForm.price} 
                          onChange={(e) => setEditForm({...editForm, price: parseFloat(e.target.value)})} 
                          placeholder={t("form.price")}
                        />
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(service.id)}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <span className="font-medium">{service.serviceName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">${service.price.toFixed(2)}</span>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => handleStartEdit(service)} 
                          disabled={disabled || editingService !== null}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => handleRemoveService(service.id)} 
                          disabled={disabled || editingService !== null}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              {t("form.noAdditionalServices")}
            </div>
          )}

          <Separator className="my-4" />

          {/* Form to add new services */}
          <div className={cn(disabled && "opacity-50 pointer-events-none")}>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service-name">{t("form.serviceName")}</Label>
                  <Input 
                    id="service-name"
                    value={newService.serviceName}
                    onChange={(e) => setNewService({...newService, serviceName: e.target.value})}
                    placeholder={t("form.serviceNamePlaceholder")}
                    disabled={disabled}
                  />
                </div>
                <div>
                  <Label htmlFor="service-price">{t("form.servicePrice")}</Label>
                  <Input 
                    id="service-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newService.price}
                    onChange={(e) => setNewService({...newService, price: parseFloat(e.target.value)})}
                    placeholder="0.00"
                    disabled={disabled}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={handleAddService}
                  disabled={disabled || !newService.serviceName || !newService.price}
                  type="button"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t("form.addService")}
                </Button>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Summary */}
          <div className="flex items-center justify-between">
            <span className="font-medium">{t("form.totalAdditionalServices")}</span>
            <span className="text-lg font-bold">${totalAdditionalPrice.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
