"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, RetailerProfile } from "@prisma/client";
import { Textarea } from "@/components/ui/textarea";

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  image: z.string().optional(),
});

const retailerFormSchema = z.object({
  companyName: z.string().optional(),
  phone: z.string().optional(),
  businessAddress: z.string().optional(),
  taxId: z.string().optional(),
  yearsInBusiness: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type RetailerFormValues = z.infer<typeof retailerFormSchema>;

export default function ProfileForm({ user, retailerProfile }: { user: User; retailerProfile: RetailerProfile | null }) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormValues & RetailerFormValues>({
    resolver: zodResolver(profileFormSchema.merge(retailerFormSchema)),
    defaultValues: {
      name: user.name || "",
      email: user.email || "",
      image: user.image || "",
      companyName: retailerProfile?.companyName || "",
      phone: retailerProfile?.phone || "",
      businessAddress: retailerProfile?.businessAddress || "",
      taxId: retailerProfile?.taxId || "",
      yearsInBusiness: retailerProfile?.yearsInBusiness || "",
    },
  });

  async function onSubmit(data: ProfileFormValues & RetailerFormValues) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.image || ""} alt={user.name} />
            <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Picture URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/your-image.jpg" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter a URL for your profile picture
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormDescription>
                This is your full name as displayed to other users.
              </FormDescription>
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
                <Input placeholder="your.email@example.com" {...field} type="email" />
              </FormControl>
              <FormDescription>
                This is the email address used for account communications.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
                <Textarea placeholder="123 Business St, City, State, ZIP" {...field} />
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
          {isLoading ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </Form>
  );
}