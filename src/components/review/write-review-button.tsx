'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ReviewForm } from '@/components/review/review-form';
import { useRouter } from 'next/navigation';

interface WriteReviewButtonProps {
  productId: string;
}

export function WriteReviewButton({ productId }: WriteReviewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    setIsOpen(false);
    // Refresh the page to show the new review
    router.refresh();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="mt-6">Write a Review</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Write Your Review</DialogTitle>
        </DialogHeader>
        <ReviewForm 
          productId={productId} 
          onSuccess={handleSuccess}
          onCancel={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
