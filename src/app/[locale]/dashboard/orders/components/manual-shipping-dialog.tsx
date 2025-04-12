"use client";

import React, { useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { Truck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format as formatDate, addDays } from "date-fns";
import { ShipmentRequest, ShippingAddress, PackageDetails } from "@/lib/shipping/shipping-interfaces";

// Schema for the manual shipping form
const manualShippingSchema = z.object({
  trackingNumber: z.string().optional().nullable(),
  provider: z.string().default("dhl"),
  estimatedDeliveryDate: z.string().optional(),
});

type ManualShippingFormValues = z.infer<typeof manualShippingSchema>;

interface ManualShippingDialogProps {
  order: any;
  onSuccess?: (shipmentResponse: any) => void;
}

export function ManualShippingDialog({
  order,
  onSuccess
}: ManualShippingDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default estimated delivery date (5 days from now)
  const defaultDeliveryDate = formatDate(addDays(new Date(), 5), "yyyy-MM-dd");
  
  const form = useForm<ManualShippingFormValues>({
    resolver: zodResolver(manualShippingSchema),
    defaultValues: {
      trackingNumber: "",
      provider: "dhl",
      estimatedDeliveryDate: defaultDeliveryDate,
    },
  });

  async function onSubmit(data: ManualShippingFormValues) {
    if (!order) return;
    
    setIsSubmitting(true);
    
    try {
      // Prepare shipping addresses
      const shipperAddress: ShippingAddress = {
        contactName: "Store Admin", // Replace with store info
        phone: "123-456-7890", // Replace with store phone
        email: "store@example.com", // Replace with store email
        addressLine1: "123 Store Street", // Replace with store address
        city: "Store City", // Replace with store city
        state: "Store State", // Replace with store state
        postalCode: "12345", // Replace with store postal code
        countryCode: "US", // Replace with store country code
      };
      
      const recipientAddress: ShippingAddress = {
        contactName: order.customer?.name || "Customer",
        phone: order.customer?.phone || "Unknown",
        email: order.customer?.email || "customer@example.com",
        addressLine1: order.shippingAddress?.addressLine1 || "",
        addressLine2: order.shippingAddress?.addressLine2 || "",
        city: order.shippingAddress?.city || "",
        state: order.shippingAddress?.state || "",
        postalCode: order.shippingAddress?.postalCode || "",
        countryCode: order.shippingAddress?.country || "US",
      };
      
      // Create packages based on order items
      const packages: PackageDetails[] = [{
        weight: 1, // Default weight
        length: 30,
        width: 20,
        height: 10,
        description: `Order #${order.orderNumber}`
      }];
      
      // Prepare shipment request
      const shipmentRequest: ShipmentRequest = {
        shipperAddress,
        recipientAddress,
        packages,
        reference: order.orderNumber,
      };
      
      // Call the manual shipping endpoint
      const response = await axios.post("/api/shipping/manual-create", {
        shipmentRequest,
        manualTrackingNumber: data.trackingNumber || undefined,
        provider: data.provider
      });
      
      // Show success message
      toast.success("Manual shipment created successfully!");
      
      // Close the dialog
      setIsOpen(false);
      
      // Call the success callback
      if (onSuccess) {
        onSuccess(response.data.shipment);
      }
      
      // Update order status to shipped
      try {
        await axios.put(`/api/orders/${order.id}/status`, {
          status: "SHIPPED",
          trackingNumber: response.data.shipment.trackingNumber,
          shippingProvider: data.provider.toUpperCase(),
        });
        
        toast.success("Order status updated to Shipped");
      } catch (updateError) {
        console.error("Error updating order status:", updateError);
        toast.error("Failed to update order status. Please update it manually.");
      }
      
    } catch (error) {
      console.error("Error creating manual shipment:", error);
      toast.error("Failed to create manual shipment");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)} variant="outline" size="sm">
          <Truck className="mr-2 h-4 w-4" />
          Create Manual Shipment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Manual Shipment</DialogTitle>
          <DialogDescription>
            Create a manual shipment record when automatic shipping creation fails.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="trackingNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tracking Number (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter tracking number or leave empty to generate one"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping Provider</FormLabel>
                  <FormControl>
                    <Input {...field} disabled value="DHL" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="estimatedDeliveryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Delivery Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Shipment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
