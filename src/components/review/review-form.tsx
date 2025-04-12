'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

import { FileUpload } from '@/components/file-upload';
import { useReviews } from '@/hooks/use-reviews';
import { Loader2 } from 'lucide-react';
import { Review } from '@/hooks/use-reviews';
import { Rating } from './rating';
import { toast } from 'sonner';

const reviewFormSchema = z.object({
  title: z.string().max(100, 'Title must be 100 characters or less').optional(),
  content: z.string().min(10, 'Review must be at least 10 characters').max(2000, 'Review must be 2000 characters or less'),
  rating: z.number().min(1, 'Please select a rating').max(5),
  images: z.array(z.object({
    fileUrl: z.string(),
    name: z.string(),
    size: z.number(),
    type: z.string(),
    lastModified: z.number(),
    key: z.string().optional(),
  })).optional(),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

interface ReviewFormProps {
  productId: string;
  initialData?: Review;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface UploadedFile {
  fileUrl: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  key?: string;
}

export function ReviewForm({ productId, initialData, onSuccess, onCancel }: ReviewFormProps) {

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(() => {
    if (initialData?.images && initialData.images.length > 0) {
      return initialData.images.map((image) => ({
        fileUrl: image.imageUrl,
        key: image.id,
        name: image.imageUrl.split('/').pop() || 'image',
        size: 0,
        type: 'image/jpeg',
        lastModified: Date.now(),
      }));
    }
    return [];
  });

  const { useCreateReview, useUpdateReview } = useReviews();
  const createReviewMutation = useCreateReview();
  const updateReviewMutation = useUpdateReview(initialData?.id || '');

  const isEditing = !!initialData;
  const isPending = createReviewMutation.isPending || updateReviewMutation.isPending;

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      content: initialData?.content || '',
      rating: initialData?.rating || 0,
      images: undefined,
    },
  });

  const handleFileChange = (files: UploadedFile[]) => {
    setUploadedFiles(files);
    
    // Update form value
    form.setValue('images', files);
  };

  const onSubmit = async (values: ReviewFormValues) => {
    try {
      // Prepare images data for API
      const imageData = uploadedFiles.map(file => ({
        url: file.fileUrl,
        caption: '',
      }));

      if (isEditing) {
        await updateReviewMutation.mutateAsync({
          rating: values.rating,
          title: values.title,
          content: values.content,
          images: imageData,
          replaceImages: true,
        });
        toast.success('Review updated successfully!');
        // Reset form after successful update
      } else {
        await createReviewMutation.mutateAsync({
          productId,
          rating: values.rating,
          title: values.title,
          content: values.content,
          images: imageData,
        });
        toast.success('Review submitted successfully!');
        // Reset form after successful submission
        form.reset();
        setUploadedFiles([]);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error('Failed to submit review. Please try again.');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rating</FormLabel>
              <FormControl>
                <Rating 
                  value={field.value} 
                  onChange={field.onChange} 
                  disabled={isPending} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Summarize your experience" 
                  {...field} 
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>
                A brief title for your review.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Review</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Share your experience with this product..." 
                  className="min-h-32" 
                  {...field} 
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>
                Please share your honest opinion about this product.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="images"
          render={() => (
            <FormItem>
              <FormLabel>Photos (Optional)</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <FileUpload
                    onChange={handleFileChange}
                    multiple={true}
                    value={uploadedFiles}
                    folder="reviews"
                    maxSize={5}
                    allowedTypes={['image/jpeg', 'image/png', 'image/webp']}
                    onUploadProgress={setUploadProgress}
                  />
                  
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  )}
                  
                  {uploadedFiles.length > 0 && (
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="relative group rounded-md overflow-hidden border h-24">
                          <img 
                            src={file.fileUrl} 
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>
                Upload photos of the product to enhance your review (optional).
                Maximum size: 5MB per image. Supported formats: JPG, PNG, WebP.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit"
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update Review' : 'Submit Review'}
          </Button>
        </div>
      </form>
    </Form>
  );
}