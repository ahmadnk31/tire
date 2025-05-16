'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useReviews, Review } from '@/hooks/use-reviews';
import { ReviewCard } from './review-card';
import { ReviewForm } from './review-form';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReviewsListProps {
  productId: string;
  initialReviews?: Review[];
}

export function ReviewsList({ productId, initialReviews }: ReviewsListProps) {
  const t = useTranslations('Account.Reviews.list');
  const tReviews = useTranslations('Account.Reviews');
  const { data: session } = useSession();
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  const { 
    useGetReviews, 
    useDeleteReview 
  } = useReviews();

  const deleteReviewMutation = useDeleteReview();

  const limit = 5; // Number of reviews per page

  // Parse sortBy into API parameters
  let sortField = 'createdAt';
  let sortOrder: 'asc' | 'desc' = 'desc';
  if (sortBy === 'helpful') {
    sortField = 'helpfulCount';
    sortOrder = 'desc';
  } else if (sortBy === 'oldest') {
    sortField = 'createdAt';
    sortOrder = 'asc';
  }
  const { data, isLoading, refetch } = useGetReviews({
    productId,
    page,
    limit,
    rating: rating !== 'all' ? parseInt(rating) : undefined,
    sortBy: sortField,
    order: sortOrder
  });

  // Use initialReviews on first render if available and we're on page 1 with no filters
  const shouldUseInitialReviews = initialReviews && page === 1 && rating === 'all' && sortBy === 'newest';
  
  // Determine which reviews to show - either the initial ones or fetched ones
  const displayedReviews = shouldUseInitialReviews ? initialReviews : data?.reviews;
  const displayLoading = isLoading && !shouldUseInitialReviews;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = (filter: string) => {
    setRating(filter);
    setPage(1); // Reset to first page when filter changes
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setPage(1); // Reset to first page when sort changes
  };

  const handleReviewEdit = (review: Review) => {
    setEditingReview(review);
    setShowReviewForm(true);
  };

  const handleReviewDelete = async (reviewId: string) => {
    try {
      await deleteReviewMutation.mutateAsync(reviewId);
      toast.success('Review deleted successfully!');
      refetch();
    } catch (error) {
      toast.error('Failed to delete review. Please try again later.');
    }
  };

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    setEditingReview(null);
    refetch();
  };
  // Calculate average rating and rating counts based on displayed reviews
  const totalReviews = data?.meta?.totalCount || (initialReviews?.length || 0);
  
  // Calculate average rating and rating counts - use either fetched data or initial reviews
  const ratingStats = shouldUseInitialReviews && initialReviews
    ? initialReviews.reduce(
        (acc, review) => {
          acc.total += review.rating;
          acc.counts[review.rating - 1]++;
          return acc;
        },
        { total: 0, counts: [0, 0, 0, 0, 0] }
      )
    : data?.reviews.reduce(
        (acc, review) => {
          acc.total += review.rating;
          acc.counts[review.rating - 1]++;
          return acc;
        },
        { total: 0, counts: [0, 0, 0, 0, 0] }
      );

  const averageRating = ratingStats && totalReviews > 0
    ? (ratingStats.total / totalReviews).toFixed(1)
    : '0.0';

  return (
    <div className="mt-6">      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">        <div>
          <h3 className="text-2xl font-semibold">{t('title')}</h3>
          {(shouldUseInitialReviews ? initialReviews?.length === 0 : data?.meta.totalCount === 0) ? (
            <p className="text-muted-foreground">{t('noReviewsYet')}</p>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center">
                <span className="text-lg font-medium">{averageRating}</span>
                <span className="text-muted-foreground ml-1">{t('averageRating')}</span>
              </div>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {totalReviews} {totalReviews === 1 ? t('review') : t('reviews')}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 md:mt-0">
          <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
            <DialogTrigger asChild>
              <Button>
                {editingReview ? tReviews('editReview') : tReviews('writeReview')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>{editingReview ? tReviews('editReview') : tReviews('writeReview')}</DialogTitle>
              </DialogHeader>
              {!session ? (
                <div className="py-6 text-center">
                  <p className="mb-4">{t('signIn')}</p>
                  <Button>{t('signInButton')}</Button>
                </div>
              ) : (
                <ReviewForm 
                  productId={productId}
                  initialData={editingReview || undefined}
                  onSuccess={handleReviewSuccess}
                  onCancel={() => {
                    setShowReviewForm(false);
                    setEditingReview(null);
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>      <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
        <div className="flex gap-4">
          <div>
            <label htmlFor="rating-filter" className="block text-sm font-medium mb-1">
              {t('filters.filterBy')}
            </label>
            <Select
              value={rating}
              onValueChange={handleFilterChange}
            >
              <SelectTrigger id="rating-filter" className="w-[140px]">
                <SelectValue placeholder={t('filters.allRatings')} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">{t('filters.allRatings')}</SelectItem>
                  <SelectItem value="5">5 {t('filters.stars')}</SelectItem>
                  <SelectItem value="4">4 {t('filters.stars')}</SelectItem>
                  <SelectItem value="3">3 {t('filters.stars')}</SelectItem>
                  <SelectItem value="2">2 {t('filters.stars')}</SelectItem>
                  <SelectItem value="1">1 {t('filters.star')}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="sort-reviews" className="block text-sm font-medium mb-1">
              {t('sort.sortBy')}
            </label>
            <Select
              value={sortBy}
              onValueChange={handleSortChange}
            >
              <SelectTrigger id="sort-reviews" className="w-[180px]">
                <SelectValue placeholder={t('sort.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="newest">{t('sort.newestFirst')}</SelectItem>
                  <SelectItem value="oldest">{t('sort.oldestFirst')}</SelectItem>
                  <SelectItem value="helpful">{t('sort.mostHelpful')}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mobile tabs for filtering */}
        <div className="sm:hidden">
          <Tabs 
            value={rating === 'all' ? 'all' : rating} 
            onValueChange={handleFilterChange}
          >
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="all">{t('tabs.all')}</TabsTrigger>
              <TabsTrigger value="5">{t('tabs.fiveStar')}</TabsTrigger>
              <TabsTrigger value="4">{t('tabs.fourStar')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>      {displayLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label={t('loading')} />
        </div>
      ) : displayedReviews?.length === 0 ? (
        <div className="border rounded-lg p-6 text-center">
          <p className="text-muted-foreground mb-4">{t('noReviewsFound')}</p>
          {rating !== 'all' && (
            <Button variant="outline" onClick={() => handleFilterChange('all')}>
              {t('showAllReviews')}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayedReviews?.map(review => (
            <ReviewCard 
              key={review.id} 
              review={review}
              onEdit={handleReviewEdit}
              onDelete={handleReviewDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.meta.totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => page > 1 && handlePageChange(page - 1)}
                className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {[...Array(data.meta.totalPages)].map((_, i) => {
              // For simplicity, only show limited pagination items
              if (
                i === 0 || // First page
                i === data.meta.totalPages - 1 || // Last page
                (i >= page - 2 && i <= page + 1) // Pages around current page
              ) {
                return (
                  <PaginationItem key={i}>
                    <PaginationLink
                      isActive={page === i + 1}
                      onClick={() => handlePageChange(i + 1)}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                );
              } else if (
                (i === 1 && page > 3) || // Show ellipsis after first page
                (i === data.meta.totalPages - 2 && page < data.meta.totalPages - 3) // Show ellipsis before last page
              ) {
                return (
                  <PaginationItem key={i}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }
              return null;
            })}
            
            <PaginationItem>
              <PaginationNext
                onClick={() => page < data.meta.totalPages && handlePageChange(page + 1)}
                className={page >= data.meta.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}