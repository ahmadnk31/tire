'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Star, Loader2 } from 'lucide-react';
import axios from 'axios';

// Testimonial form schema
const testimonialSchema = z.object({
  customerTitle: z.string().optional(),
  content: z.string().min(10, { message: 'Testimonial must be at least 10 characters' }).max(1000, { message: 'Testimonial cannot exceed 1000 characters' }),
  rating: z.number().min(1).max(5),
});

type TestimonialFormValues = z.infer<typeof testimonialSchema>;

export default function UserTestimonialForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // Set up form with default values
  const form = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      customerTitle: '',
      content: '',
      rating: 5,
    },
  });

  // Handle form submission
  const onSubmit = async (data: TestimonialFormValues) => {
    setIsSubmitting(true);
    
    try {
      await axios.post('/api/user/testimonial', data);
      
      toast.success(
        'Thank you for your testimonial! It has been submitted for review and will appear on our site once approved.'
      );
      
      form.reset();
      setHasSubmitted(true);
      
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      toast.error('Failed to submit testimonial. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Star rating component
  const StarRating = () => {
    const rating = form.watch('rating');
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            className="focus:outline-none"
            onClick={() => form.setValue('rating', value)}
          >
            <Star
              className={`h-6 w-6 ${
                value <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
              } transition-colors`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (hasSubmitted) {
    return (
      <div className="bg-green-50 border border-green-100 rounded-md p-6 text-center">
        <h3 className="text-lg font-medium text-green-800 mb-2">Thank you for your testimonial!</h3>
        <p className="text-green-700 mb-4">
          Your testimonial has been submitted for review and will appear on our site once approved.
        </p>
        <Button 
          variant="outline" 
          onClick={() => setHasSubmitted(false)}
        >
          Submit Another Testimonial
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Share Your Experience</h3>
        <p className="text-sm text-muted-foreground">
          We value your feedback. Please share your experience with our products or services.
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="customerTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Title/Company (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Car Enthusiast / Company Name" {...field} />
                </FormControl>
                <FormDescription>
                  Adding your title or company adds credibility to your testimonial
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
                <FormLabel>Rating</FormLabel>
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
                <FormLabel>Your Testimonial</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Share your experience with our products or services..."
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Your testimonial will be reviewed before being published on our website
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
              </>
            ) : (
              'Submit Testimonial'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
