"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { InstallationServiceType, InstallationStatus, PurchaseLocation } from "@/types/installation";
import { useCreateInstallation } from "@/hooks/use-installations";

export function InstallationForm() {
  const t = useTranslations("Homepage.services.installationPage.form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Import enums from types


// Create schema based on translations
  const formSchema = z.object({
    vehicleMake: z.string().min(1, { message: "Make is required" }),
    vehicleModel: z.string().min(1, { message: "Model is required" }),
    vehicleYear: z.string().min(1, { message: "Year is required" }),
    tireSize: z.string().min(1, { message: "Tire size is required" }),
    tireQuantity: z.string().min(1, { message: "Quantity is required" }),
    purchasedFrom: z.nativeEnum(PurchaseLocation, { 
      errorMap: () => ({ message: "Where purchased is required" })
    }),
    serviceType: z.nativeEnum(InstallationServiceType, {
      errorMap: () => ({ message: "Service type is required" })
    }),
    appointmentDate: z.date({ required_error: "Date is required" }),
    appointmentTime: z.string().min(1, { message: "Time is required" }),
    customerName: z.string().min(1, { message: "Name is required" }),
    customerEmail: z.string().email({ message: "Invalid email address" }),
    customerPhone: z.string().min(1, { message: "Phone number is required" }),
    comments: z.string().optional(),
    consent: z.boolean().refine((val) => val === true, {
      message: "You must agree to be contacted",
    }),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicleMake: "",
      vehicleModel: "",
      vehicleYear: "",
      tireSize: "",
      tireQuantity: "",
      purchasedFrom: undefined,
      serviceType: InstallationServiceType?.STANDARD,
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      comments: "",
      consent: false,
    },
  });
  // Import the useCreateInstallation hook
  const { mutateAsync: createInstallation } = useCreateInstallation();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      
      // Set default status for new installation requests
      const installationData = {
        ...values,
        status: InstallationStatus.SCHEDULED,
        // Set a default base price based on service type
        basePrice: values.serviceType === InstallationServiceType.STANDARD ? "20" : 
                  values.serviceType === InstallationServiceType.PREMIUM ? "30" : "40"
      };
      
      // Submit the form data to the API using our hook
      await createInstallation(installationData);
      
      // Show success state after submission
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting installation form:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="p-8 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
        <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-2">
          {t("success")}
        </h3>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto border rounded-lg p-8 shadow-sm">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Vehicle Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t("vehicle")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">              <FormField
                control={form.control}
                name="vehicleMake"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("make")}</FormLabel>                    <FormControl>
                      <Input placeholder={t("makePlaceholder")} {...field} />
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
                    <FormLabel>{t("model")}</FormLabel>                    <FormControl>
                      <Input placeholder={t("modelPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vehicleYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("year")}</FormLabel>                    <FormControl>
                      <Input placeholder={t("yearPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Tire Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t("tires")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">              
                <FormField
                control={form.control}
                name="tireSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("size")}</FormLabel>                    <FormControl>
                      <Input placeholder={t("sizePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />              <FormField
                control={form.control}
                name="tireQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quantity")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectQuantity")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />                <FormField
                control={form.control}
                name="purchasedFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("purchased")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("wherePurchased")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="OUR_STORE">{t("purchasedOptions.us")}</SelectItem>
                        <SelectItem value="ELSEWHERE">{t("purchasedOptions.elsewhere")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>          {/* Service Type */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t("serviceType")}</h3>
            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("serviceTypeLabel")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectServiceType")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='STANDARD'>
                          {t("serviceTypes.standard")}
                        </SelectItem>
                        <SelectItem value='PREMIUM'>
                          {t("serviceTypes.premium")}
                        </SelectItem>
                        <SelectItem value='SPECIALTY' >
                          {t("serviceTypes.specialty")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Appointment Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t("appointment")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="appointmentDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("date")}</FormLabel>
                    <Popover>                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>{t("pickDate")}</span>
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
                            date < new Date() || date > new Date(2025, 12, 31)
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />              <FormField
                control={form.control}
                name="appointmentTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("time")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectTime")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="9:00">{t("timeSlots.9am")}</SelectItem>
                        <SelectItem value="10:00">{t("timeSlots.10am")}</SelectItem>
                        <SelectItem value="11:00">{t("timeSlots.11am")}</SelectItem>
                        <SelectItem value="12:00">{t("timeSlots.12pm")}</SelectItem>
                        <SelectItem value="13:00">{t("timeSlots.1pm")}</SelectItem>
                        <SelectItem value="14:00">{t("timeSlots.2pm")}</SelectItem>
                        <SelectItem value="15:00">{t("timeSlots.3pm")}</SelectItem>
                        <SelectItem value="16:00">{t("timeSlots.4pm")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t("contact")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("name")}</FormLabel>                    <FormControl>
                      <Input placeholder={t("namePlaceholder")} {...field} />
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
                    <FormLabel>{t("email")}</FormLabel>                    <FormControl>
                      <Input placeholder={t("emailPlaceholder")} {...field} />
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
                    <FormLabel>{t("phone")}</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Additional Comments */}          <FormField
            control={form.control}
            name="comments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("comments")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("commentsPlaceholder")}
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Consent Checkbox */}
          <FormField
            control={form.control}
            name="consent"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    {t("consent")}
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "..." : t("submit")}
          </Button>
        </form>
      </Form>
    </div>
  );
}
