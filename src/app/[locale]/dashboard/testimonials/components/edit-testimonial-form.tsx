"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Star } from "lucide-react";
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

// Form schema
const testimonialSchema = z.object({
  customerName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  customerTitle: z.string().optional(),
  content: z.string().min(10, { message: "Testimonial must be at least 10 characters" }).max(1000, { message: "Testimonial cannot exceed 1000 characters" }),
  rating: z.coerce.number().min(1).max(5),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "FEATURED"]).default("APPROVED"),
  adminNotes: z.string().optional(),
});

type TestimonialFormValues = z.infer<typeof testimonialSchema>;

interface Testimonial {
  id: string;
  customerName: string;
  customerTitle?: string;
  customerImage?: string;
  content: string;
  rating: number;
  isVisible: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FEATURED';
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function EditTestimonialForm({ 
  testimonial, 
  onSuccess, 
  onCancel 
}: { 
  testimonial: Testimonial, 
  onSuccess: () => void, 
  onCancel: () => void 
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      customerName: testimonial.customerName,
      customerTitle: testimonial.customerTitle || "",
      content: testimonial.content,
      rating: testimonial.rating,
      status: testimonial.status,
      adminNotes: testimonial.adminNotes || "",
    },
  });
  
  async function onSubmit(data: TestimonialFormValues) {
    setIsSubmitting(true);
    
    try {
      await axios.put(`/api/testimonials/${testimonial.id}`, data);
      toast.success("Testimonial updated successfully");
      onSuccess();
    } catch (error) {
      console.error("Error updating testimonial:", error);
      toast.error("Failed to update testimonial");
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Star rating component
  const StarRating = () => {
    const rating = form.watch("rating");
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            className="focus:outline-none"
            onClick={() => form.setValue("rating", value)}
          >
            <Star
              className={`h-6 w-6 ${
                value <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
              } transition-colors`}
            />
          </button>
        ))}
      </div>
    );
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="customerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer Name *</FormLabel>
              <FormControl>
                <Input placeholder="John Smith" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="customerTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title/Company</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Car Enthusiast / Company Name" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Customer's professional title or company name
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rating *</FormLabel>
              <FormControl>
                <StarRating />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Testimonial Content *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="The customer's testimonial text..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PENDING">Pending Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="FEATURED">Featured</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Current status of this testimonial
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="adminNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Admin Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Internal notes about this testimonial (not visible to customers)"
                  className="min-h-[80px]"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                These notes are for internal use only
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
              </>
            ) : (
              "Update Testimonial"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
