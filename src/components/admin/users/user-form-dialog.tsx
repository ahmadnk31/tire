"use client";

import React, { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { useCreateUser, useGetUser, useUpdateUser } from "@/hooks/use-admin-queries";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "update";
  userId?: string | null;
}

// Form schema for creating/updating a user
const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional()
    .or(z.literal("")),
  role: z.enum(["USER", "ADMIN", "RETAILER"]),
});

const updateUserSchema = createUserSchema.extend({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional()
    .or(z.literal("")),
});

export function UserFormDialog({
  open,
  onOpenChange,
  mode,
  userId,
}: UserFormDialogProps) {
  const isCreating = mode === "create";
  
  // Queries and mutations
  const { data: user, isLoading: isLoadingUser } = useGetUser(isCreating ? null : userId);
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  
  // Form
  const form = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(isCreating ? createUserSchema : updateUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "USER",
    },
  });

  // Reset form when dialog opens/closes or when user data changes
  useEffect(() => {
    if (open) {
      if (isCreating) {
        form.reset({
          name: "",
          email: "",
          password: "",
          role: "USER",
        });
      } else if (user) {
        form.reset({
          name: user.name,
          email: user.email,
          password: "",  // We don't populate the password field
          role: user.role as "USER" | "ADMIN" | "RETAILER",
        });
      }
    }
  }, [open, isCreating, user, form]);

  // Form submission handler
  const onSubmit = async (values: z.infer<typeof createUserSchema>) => {
    try {
      if (isCreating) {
        await createUserMutation.mutateAsync({
          name: values.name,
          email: values.email,
          password: values.password as string,
          role: values.role,
        });
      } else if (userId) {
        const updateData = {
          name: values.name,
          email: values.email,
          role: values.role,
        } as any;
        
        // Only include password if it was provided
        if (values.password) {
          updateData.password = values.password;
        }
        
        await updateUserMutation.mutateAsync({
          id: userId,
          data: updateData,
        });
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const isSubmitting = createUserMutation.isPending || updateUserMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isCreating ? "Create New User" : "Edit User"}
          </DialogTitle>
          <DialogDescription>
            {isCreating
              ? "Add a new user to the system"
              : "Update user information"}
          </DialogDescription>
        </DialogHeader>
        
        {(isLoadingUser && !isCreating) ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john.doe@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isCreating ? "Password" : "New Password (optional)"}</FormLabel>
                    <FormControl>
                      <Input placeholder={isCreating ? "Password" : "Leave blank to keep current"} type="password" {...field} />
                    </FormControl>
                    {!isCreating && (
                      <FormDescription>
                        Leave empty to keep the current password
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USER">User</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="RETAILER">Retailer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isCreating ? "Create" : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
