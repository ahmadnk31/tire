"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { RetailerProfile } from "@prisma/client";

const retailerFormSchema = z.object({
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters." }),
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
  businessAddress: z.string().min(5, { message: "Please enter a valid business address." }),
  taxId: z.string().optional(),
  yearsInBusiness: z.string(),
});

type RetailerFormValues = z.infer<typeof retailerFormSchema>;

export default function RetailerForm({ 
  retailerProfile, 
  userId 
}: { 
  retailerProfile: RetailerProfile | null;
  userId: string;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RetailerFormValues>({
    resolver: zodResolver(retailerFormSchema),
    defaultValues: {
      companyName: retailerProfile?.companyName || "",
      phone: retailerProfile?.phone || "",
      businessAddress: retailerProfile?.businessAddress || "",
      taxId: retailerProfile?.taxId || "",
      yearsInBusiness: retailerProfile?.yearsInBusiness || "",
    },
  });

  async function onSubmit(data: RetailerFormValues) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/settings/retailer", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update retailer profile");
      }

      toast.success("Retailer profile updated successfully");
    } catch (error) {
      toast.error("Failed to update retailer profile. Please try again.");
      console.error("Error updating retailer profile:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Your company name" {...field} />
              </FormControl>
              <FormDescription>The legal name of your business.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Phone</FormLabel>
              <FormControl>
                <Input placeholder="(555) 123-4567" {...field} />
              </FormControl>
              <FormDescription>Your primary business contact number.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="businessAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Address</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="123 Business St, City, State, ZIP"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>Your business's physical location or mailing address.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="taxId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax ID (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="XX-XXXXXXX" {...field} />
              </FormControl>
              <FormDescription>Your business tax identification number or EIN.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="yearsInBusiness"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Years in Business</FormLabel>
              <FormControl>
                <Input placeholder="5" {...field} />
              </FormControl>
              <FormDescription>How long your business has been operating.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}