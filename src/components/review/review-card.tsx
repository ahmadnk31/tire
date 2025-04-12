'use client'
import { useState } from 'react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, MessageSquare, ChevronDown, ChevronUp, Image, Edit, Trash2 } from 'lucide-react';
import { ReadOnlyRating } from './rating';
import { useReviews, Review, ReviewComment } from '@/hooks/use-reviews';
import { ReviewCommentForm } from './review-comment-form';
import { ReviewCommentItem } from './review-comment-item';
import { Textarea } from '@/components/ui/textarea';

import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { toast } from 'sonner';

interface ReviewCardProps {
  review: Review;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
}

export function ReviewCard({ review, onEdit, onDelete }: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentPage, setCommentPage] = useState(1);
  const { data: session } = useSession();
  
  const { 
    useToggleLike, 
    useAddComment, 
    useGetReviewComments 
  } = useReviews();
  
  const toggleLikeMutation = useToggleLike();
  const addCommentMutation = useAddComment();
  
  // Only fetch comments when they're shown
  const { 
    data: commentsData, 
    isLoading: commentsLoading 
  } = useGetReviewComments(
    showComments ? review.id : undefined,
    commentPage,
    5
  );

  const handleToggleLike = () => {
    if (!session) {
      toast.error("Authentication required. Please log in to like reviews.");
      return;
    }

    toggleLikeMutation.mutate(review.id);
  };

  const handleCommentSubmit = (content: string) => {
    if (!session) {
      toast.error("Authentication required. Please log in to comment on reviews.");
      return;
    }

    addCommentMutation.mutate({
      reviewId: review.id,
      content,
    }, {
      onSuccess: () => {
        setIsCommenting(false);
        // If comments weren't showing before, show them after posting
        if (!showComments) {
          setShowComments(true);
        }
      }
    });
  };

  const loadMoreComments = () => {
    if (commentsData && commentPage < commentsData.meta.totalPages) {
      setCommentPage(prev => prev + 1);
    }
  };

  const handleDeleteClick = () => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      onDelete?.(review.id);
    }
  };

  const userName = review.user?.name || 'Anonymous';
  const userInitials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={review.user.image || ''} alt={userName} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{userName}</p>
                {review.verified && (
                  <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                    Verified Purchase
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ReadOnlyRating value={review.rating} />
                <span>•</span>
                <span>{format(new Date(review.createdAt), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>
          {(session?.user?.id === review.userId || session?.user?.role === 'ADMIN') && (
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onEdit?.(review)}
                title="Edit review"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleDeleteClick}
                title="Delete review"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {review.title && (
          <h4 className="font-semibold mb-2">{review.title}</h4>
        )}
        
        <div className={cn(
          "prose prose-sm dark:prose-invert max-w-none",
          !isExpanded && 'line-clamp-3'
        )}>
          <p>{review.content}</p>
        </div>
        
        {review.content.length > 200 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="px-0 text-sm font-medium h-auto mt-1"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>Read less <ChevronUp className="h-4 w-4 ml-1" /></>
            ) : (
              <>Read more <ChevronDown className="h-4 w-4 ml-1" /></>
            )}
          </Button>
        )}

        {review.images && review.images.length > 0 && (
          <div className="mt-4">
            <Dialog>
              <div className="flex items-center gap-2 mb-2">
                <Image className="h-4 w-4" />
                <span className="text-sm font-medium">Photos</span>
              </div>
              <Carousel className="max-w-md">
                <CarouselContent>
                  {review.images.map((image, index) => (
                    <CarouselItem key={image.id} className="basis-1/3">
                      <DialogTrigger asChild>
                        <div className="relative h-24 cursor-pointer rounded-md overflow-hidden border">
                          <img 
                            src={image.imageUrl} 
                            alt={`Review image ${index + 1}`} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </DialogTrigger>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {review.images.length > 3 && (
                  <>
                    <CarouselPrevious className="left-1" />
                    <CarouselNext className="right-1" />
                  </>
                )}
              </Carousel>
              <DialogContent className="sm:max-w-xl">
                <Carousel className="w-full">
                  <CarouselContent>
                    {review.images.map((image, index) => (
                      <CarouselItem key={image.id}>
                        <div className="flex justify-center items-center h-full">
                          <img 
                            src={image.imageUrl} 
                            alt={`Review image ${index + 1} full size`} 
                            className="max-h-[70vh] object-contain"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start pt-2">
        <div className="flex gap-4 mb-2 w-full">
          <Button 
            variant={review.hasLiked ? "secondary" : "ghost"} 
            size="sm" 
            className={cn(
              "flex items-center gap-1",
              review.hasLiked && "bg-primary/10"
            )}
            onClick={handleToggleLike}
            disabled={toggleLikeMutation.isPending}
          >
            <ThumbsUp className="h-4 w-4" />
            <span>
              {review._count.likes || review.helpfulCount} {review._count.likes === 1 ? 'person' : 'people'} found this helpful
            </span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={() => {
              if (showComments) {
                setShowComments(false);
              } else {
                setShowComments(true);
              }
            }}
          >
            <MessageSquare className="h-4 w-4" />
            <span>{review._count.comments} {review._count.comments === 1 ? 'comment' : 'comments'}</span>
          </Button>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="w-full pl-4 border-l-2 mt-4 space-y-4">
            {commentsLoading ? (
              <p className="text-sm text-muted-foreground">Loading comments...</p>
            ) : (
              <>
                {commentsData?.comments.map(comment => (
                  <ReviewCommentItem 
                    key={comment.id} 
                    comment={comment} 
                  />
                ))}
                
                {commentsData?.comments.length === 0 && !isCommenting && (
                  <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
                )}
                
                {commentsData && commentPage < commentsData.meta.totalPages && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={loadMoreComments}
                  >
                    Load more comments
                  </Button>
                )}
              </>
            )}
            
            {isCommenting ? (
              <ReviewCommentForm 
                onSubmit={handleCommentSubmit}
                onCancel={() => setIsCommenting(false)}
                isSubmitting={addCommentMutation.isPending}
              />
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-sm"
                onClick={() => setIsCommenting(true)}
              >
                Add a comment
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}