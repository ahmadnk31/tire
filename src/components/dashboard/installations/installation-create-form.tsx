"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarIcon, Loader2Icon } from "lucide-react";
import { format } from "date-fns";
import { InstallationFormSchema, InstallationServiceType, InstallationStatus, PurchaseLocation } from "@/types/installation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AdditionalService, InstallationAdditionalServices } from "./installation-additional-services";

interface InstallationCreateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InstallationCreateForm({ onSuccess, onCancel }: InstallationCreateFormProps) {
  const t = useTranslations("Dashboard.installations");
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [additionalServices, setAdditionalServices] = useState<AdditionalService[]>([]);

  // Set up default values with today's date
  const today = new Date();
  
  const form = useForm({
    resolver: zodResolver(InstallationFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      vehicleMake: "",
      vehicleModel: "",
      vehicleYear: new Date().getFullYear().toString(),
      tireSize: "",
      tireQuantity: "4",
      purchasedFrom: PurchaseLocation.OUR_STORE,
      serviceType: InstallationServiceType.STANDARD,
      appointmentDate: today,
      appointmentTime: "09:00",
      comments: "",
      technician: "",
      bay: "",
      basePrice: "89.99",
      status: InstallationStatus.SCHEDULED,
    },
  });

  const onSubmit = async (values: any) => {
    setIsPending(true);
    
    try {
      // Convert string values to numbers
      const formData = {
        ...values,
        vehicleYear: parseInt(values.vehicleYear),
        tireQuantity: parseInt(values.tireQuantity),
        basePrice: parseFloat(values.basePrice),
        additionalServices,
        totalPrice: parseFloat(values.basePrice) + additionalServices.reduce((sum, service) => sum + service.price, 0),
      };

      // API call to create installation
      const response = await fetch('/api/installations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create installation');
      }

      const data = await response.json();
      
      if (onSuccess) {
        onSuccess();
      } else {
        // Navigate to the new installation details page
        router.push(`/dashboard/installations/${data.id}`);
        router.refresh();
      }
    } catch (error) {
      console.error('Error creating installation:', error);
      // You could add toast notifications here
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Customer Information */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t("create.customerInformation")}</h3>
                  
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.customerName")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>{t("form.customerEmail")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>{t("form.customerPhone")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Vehicle Information */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t("create.vehicleInformation")}</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="vehicleMake"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("form.vehicleMake")}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="vehicleModel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("form.vehicleModel")}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="vehicleYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.vehicleYear")}</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tireSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("form.tireSize")}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="tireQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("form.tireQuantity")}</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="1" max="8" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="purchasedFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.purchasedFrom")}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("form.selectPurchaseLocation")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={PurchaseLocation.OUR_STORE}>{t("form.purchasedFromUs")}</SelectItem>
                            <SelectItem value={PurchaseLocation.ELSEWHERE}>{t("form.purchasedElsewhere")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Service Information */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t("create.serviceInformation")}</h3>
                  
                  <FormField
                    control={form.control}
                    name="serviceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.serviceType")}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("form.selectServiceType")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={InstallationServiceType.STANDARD}>{t("serviceType.STANDARD")}</SelectItem>
                            <SelectItem value={InstallationServiceType.PREMIUM}>{t("serviceType.PREMIUM")}</SelectItem>
                            <SelectItem value={InstallationServiceType.SPECIALTY}>{t("serviceType.SPECIALTY")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.status")}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("form.selectStatus")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={InstallationStatus.SCHEDULED}>{t("status.scheduled")}</SelectItem>
                            <SelectItem value={InstallationStatus.CONFIRMED}>{t("status.confirmed")}</SelectItem>
                            <SelectItem value={InstallationStatus.IN_PROGRESS}>{t("status.inProgress")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="technician"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("form.technician")}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("form.bay")}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appointment Information */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t("create.appointmentInformation")}</h3>
                  
                  <FormField
                    control={form.control}
                    name="appointmentDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t("form.appointmentDate")}</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
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
                              disabled={(date) => date < new Date()}
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
                        <FormLabel>{t("form.appointmentTime")}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("form.selectTime")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="09:00">9:00 AM</SelectItem>
                            <SelectItem value="10:00">10:00 AM</SelectItem>
                            <SelectItem value="11:00">11:00 AM</SelectItem>
                            <SelectItem value="12:00">12:00 PM</SelectItem>
                            <SelectItem value="13:00">1:00 PM</SelectItem>
                            <SelectItem value="14:00">2:00 PM</SelectItem>
                            <SelectItem value="15:00">3:00 PM</SelectItem>
                            <SelectItem value="16:00">4:00 PM</SelectItem>
                            <SelectItem value="17:00">5:00 PM</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.comments")}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t("form.commentsPlaceholder")}
                            className="resize-none min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>{t("form.commentsDescription")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing Information */}
            <Card className="md:col-span-2">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t("create.pricingInformation")}</h3>
                  
                  <FormField
                    control={form.control}
                    name="basePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.basePrice")}</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" min="0" />
                        </FormControl>
                        <FormDescription>{t("form.basePriceDescription")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <InstallationAdditionalServices
                    initialServices={additionalServices}
                    onServicesChange={setAdditionalServices}
                    disabled={isPending}
                  />
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between font-medium">
                    <span>{t("form.totalPrice")}</span>
                    <span>
                      $
                      {(
                        parseFloat(form.getValues("basePrice") || "0") +
                        additionalServices.reduce((acc, service) => acc + service.price, 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={onCancel}>
                  {t("create.cancelButton")}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      {t("create.creating")}
                    </>
                  ) : (
                    t("create.createButton")
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}
