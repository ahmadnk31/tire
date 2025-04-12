"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as z from "zod";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

// Form validation schema
const modelFormSchema = z.object({
  name: z.string().min(2, { message: "Model name must be at least 2 characters" }),
  description: z.string().optional(),
  brandId: z.string().min(1, { message: "Brand is required" }),
});

type ModelFormValues = z.infer<typeof modelFormSchema>;

interface ModelFormProps {
  initialData?: {
    id: string;
    name: string;
    description?: string | null;
    brandId: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  onClose: () => void;
}

export function ModelForm({ initialData, onClose }: ModelFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(true);

  // Form initialization
  const form = useForm<ModelFormValues>({
    resolver: zodResolver(modelFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      brandId: initialData?.brandId || "",
    },
  });

  // Fetch brands for the select dropdown
  const { data: brandsData, isLoading: isBrandsLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const response = await fetch("/api/brands");
      if (!response.ok) {
        throw new Error("Failed to fetch brands");
      }
      return response.json();
    },
  });
  const brands = brandsData?.brands || [];

  // Create mutation
  const { mutate: createModel, isPending: isCreating } = useMutation({
    mutationFn: async (values: ModelFormValues) => {
      const response = await fetch("/api/models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create model");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Model created successfully");
      queryClient.invalidateQueries({ queryKey: ["models"] });
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update mutation
  const { mutate: updateModel, isPending: isUpdating } = useMutation({
    mutationFn: async (values: ModelFormValues) => {
      const response = await fetch(`/api/models/${initialData?.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update model");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Model updated successfully");
      queryClient.invalidateQueries({ queryKey: ["models"] });
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const onSubmit = (values: ModelFormValues) => {
    if (initialData) {
      updateModel(values);
    } else {
      createModel(values);
    }
  };

  const isPending = isCreating || isUpdating;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isPending && setIsOpen(open)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Model" : "Add Model"}</DialogTitle>
          <DialogDescription>
            {initialData
              ? "Update the model details."
              : "Add a new model for a brand."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="brandId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <Select
                    disabled={isPending || isBrandsLoading}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a brand" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isBrandsLoading ? (
                        <div className="flex items-center justify-center h-10">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        brands?.map((brand: any) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the brand this model belongs to.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter model name"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The name of the model (e.g., "CrossClimate 2").
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter model description"
                      disabled={isPending}
                      {...field}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormDescription>
                    A brief description of the model (optional).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}