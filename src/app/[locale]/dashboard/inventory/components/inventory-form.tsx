"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";

const inventorySchema = z.object({
  productId: z.string().min(1, "Please select a product"),
  quantity: z.coerce.number().int().min(0, "Quantity cannot be negative"),
  minimumLevel: z.coerce.number().int().min(0, "Minimum level cannot be negative"),
  reorderLevel: z.coerce.number().int().min(0, "Reorder level cannot be negative"),
  reorderQty: z.coerce.number().int().min(1, "Reorder quantity must be at least 1"),
});

type InventoryFormValues = z.infer<typeof inventorySchema>;

interface InventoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  inventory?: any;
  locationId: string;
  productOptions: Array<{ id: string; name: string }>;
}

export function InventoryForm({ 
  isOpen, 
  onClose, 
  inventory, 
  locationId,
  productOptions 
}: InventoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!inventory;

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      productId: inventory?.productId || "",
      quantity: inventory?.quantity || 0,
      minimumLevel: inventory?.minimumLevel || 5,
      reorderLevel: inventory?.reorderLevel || 10,
      reorderQty: inventory?.reorderQty || 20,
    },
  });

  const onSubmit = async (data: InventoryFormValues) => {
    setIsSubmitting(true);
    try {
      const url = isEditMode 
        ? `/api/inventory/${inventory.id}` 
        : "/api/inventory";
      
      const method = isEditMode ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          locationId,
        }),
      });

      if (response.ok) {
        toast.success(
          isEditMode
            ? "Inventory updated successfully"
            : "Inventory added successfully"
        );
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || "Something went wrong");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Inventory" : "Add Product to Inventory"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update inventory details for this product"
              : "Add a new product to this location's inventory"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isEditMode}
                      {...field}
                    >
                      <option value="" disabled>
                        Select a product
                      </option>
                      {productOptions.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormDescription>
                    {isEditMode && "Product cannot be changed once inventory is created"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormDescription>
                    Current stock quantity
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="minimumLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Level</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormDescription>
                      Low stock threshold
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reorderLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder Level</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormDescription>
                      When to reorder
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reorderQty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormDescription>
                      How much to reorder
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditMode ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  <>{isEditMode ? "Update" : "Add"}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}