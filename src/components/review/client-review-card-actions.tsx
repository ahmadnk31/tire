'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReviewForm } from '@/components/review/review-form';
import { ReviewCard } from '@/components/review/review-card';
import { useReviews, Review } from '@/hooks/use-reviews';
import { toast } from 'sonner';

interface ClientReviewCardActionsProps {
  review: Review;
}

export function ClientReviewCardActions({ review }: ClientReviewCardActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { useDeleteReview } = useReviews();
  const deleteReviewMutation = useDeleteReview();

  const handleEdit = (review: Review) => {
    setIsEditDialogOpen(true);
  };

  const handleDelete = (reviewId: string) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      deleteReviewMutation.mutate(reviewId, {
        onSuccess: () => {
          toast.success('Review deleted successfully');
          // You might want to refresh the reviews list or update the UI here
        },
        onError: (error) => {
          toast.error('Failed to delete review');
          console.error('Error deleting review:', error);
        }
      });
    }
  };

  return (
    <>
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Your Review</DialogTitle>
          </DialogHeader>
          <ReviewForm 
            productId={review.productId}
            initialData={review}
            onSuccess={() => setIsEditDialogOpen(false)}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* ReviewCard with functional edit and delete handlers */}
      <ReviewCard 
        review={review}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </>
  );
}
