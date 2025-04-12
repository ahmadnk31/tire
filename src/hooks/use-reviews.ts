import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface ReviewImage {
  id: string;
  reviewId: string;
  imageUrl: string;
  caption?: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  image?: string;
}

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  title?: string;
  content: string;
  verified: boolean;
  helpfulCount: number;
  status: 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'REPORTED';
  createdAt: string;
  updatedAt: string;
  user: User;
  images: ReviewImage[];
  _count: {
    likes: number;
    comments: number;
  };
  hasLiked?: boolean;
}

interface ReviewsResponse {
  reviews: Review[];
  meta: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
  };
}

interface CommentsResponse {
  comments: ReviewComment[];
  meta: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
  };
}

export interface ReviewComment {
  id: string;
  reviewId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: User;
}

interface CreateReviewData {
  productId: string;
  rating: number;
  title?: string;
  content: string;
  images?: { url: string; caption?: string }[];
}

interface UpdateReviewData {
  rating?: number;
  title?: string;
  content?: string;
  images?: { url: string; caption?: string }[];
  replaceImages?: boolean;
}

interface FetchReviewsOptions {
  productId?: string;
  userId?: string;
  page?: number;
  limit?: number;
  rating?: number;
  withImages?: boolean;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export function useReviews() {
  const queryClient = useQueryClient();

  // Function to fetch reviews with pagination and filtering
  const fetchReviews = async ({ 
    productId, userId, page = 1, limit = 10, rating, withImages, sortBy, order 
  }: FetchReviewsOptions) => {
    let url = '/api/reviews?';
    
    if (productId) url += `productId=${productId}&`;
    if (userId) url += `userId=${userId}&`;
    if (page) url += `page=${page}&`;
    if (limit) url += `limit=${limit}&`;
    if (rating) url += `rating=${rating}&`;
    if (withImages) url += `withImages=${withImages}&`;
    if (sortBy) url += `sortBy=${sortBy}&`;
    if (order) url += `order=${order}&`;
    
    const { data } = await axios.get<ReviewsResponse>(url);
    return data;
  };

  // Hook for fetching reviews
  const useGetReviews = (options: FetchReviewsOptions) => {
    return useQuery<ReviewsResponse>({
      queryKey: ['reviews', options],
      queryFn: () => fetchReviews(options),
    });
  };

  // Hook for fetching a single review
  const useGetReview = (reviewId: string | undefined) => {
    return useQuery<Review>({
      queryKey: ['review', reviewId],
      queryFn: async () => {
        if (!reviewId) throw new Error('Review ID is required');
        const { data } = await axios.get(`/api/reviews/${reviewId}`);
        return data;
      },
      enabled: !!reviewId,
    });
  };

  // Hook for fetching comments for a review
  const useGetReviewComments = (reviewId: string | undefined, page = 1, limit = 10) => {
    return useQuery<CommentsResponse>({
      queryKey: ['reviewComments', reviewId, page, limit],
      queryFn: async () => {
        if (!reviewId) throw new Error('Review ID is required');
        const { data } = await axios.get(`/api/reviews/${reviewId}/comments?page=${page}&limit=${limit}`);
        return data;
      },
      enabled: !!reviewId,
    });
  };

  // Mutation for creating a new review
  const useCreateReview = () => {
    return useMutation<Review, Error, CreateReviewData>({
      mutationFn: async (reviewData) => {
        const { data } = await axios.post('/api/reviews', reviewData);
        return data;
      },
      onSuccess: (data) => {
        // Invalidate queries to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['reviews'] });
        
        // If the new review is for a specific product, also invalidate that product's reviews
        if (data.productId) {
          queryClient.invalidateQueries({ 
            queryKey: ['reviews', { productId: data.productId }] 
          });
        }
      },
    });
  };

  // Mutation for updating a review
  const useUpdateReview = (reviewId: string) => {
    return useMutation<Review, Error, UpdateReviewData>({
      mutationFn: async (reviewData) => {
        const { data } = await axios.patch(`/api/reviews/${reviewId}`, reviewData);
        return data;
      },
      onSuccess: (data) => {
        // Update the review in the cache
        queryClient.setQueryData(['review', reviewId], data);
        
        // Invalidate the reviews list to reflect the changes
        queryClient.invalidateQueries({ queryKey: ['reviews'] });
        
        // If the review is for a specific product, also invalidate that product's reviews
        if (data.productId) {
          queryClient.invalidateQueries({ 
            queryKey: ['reviews', { productId: data.productId }] 
          });
        }
      },
    });
  };

  // Mutation for deleting a review
  const useDeleteReview = () => {
    return useMutation<void, Error, string>({
      mutationFn: async (reviewId) => {
        await axios.delete(`/api/reviews/${reviewId}`);
      },
      onSuccess: (_data, reviewId) => {
        // Remove the review from the cache
        queryClient.removeQueries({ queryKey: ['review', reviewId] });
        
        // Invalidate the reviews list to reflect the changes
        queryClient.invalidateQueries({ queryKey: ['reviews'] });
      },
    });
  };

  // Mutation for toggling like on a review
  const useToggleLike = () => {
    return useMutation<{ liked: boolean }, Error, string>({
      mutationFn: async (reviewId) => {
        const { data } = await axios.post(`/api/reviews/${reviewId}/like`);
        return data;
      },
      onSuccess: (_data, reviewId) => {
        // Update the review in the cache to reflect the new like status
        queryClient.invalidateQueries({ queryKey: ['review', reviewId] });
        
        // Optional: Optimistic update to immediately show the like/unlike action
        queryClient.setQueryData<Review>(
          ['review', reviewId],
          (oldData) => {
            if (!oldData) return undefined;
            
            return {
              ...oldData,
              hasLiked: !oldData.hasLiked,
              helpfulCount: oldData.hasLiked 
                ? oldData.helpfulCount - 1 
                : oldData.helpfulCount + 1,
              _count: {
                ...oldData._count,
                likes: oldData.hasLiked
                  ? oldData._count.likes - 1
                  : oldData._count.likes + 1,
              },
            };
          }
        );
        
        // Also update in the reviews list
        queryClient.invalidateQueries({ queryKey: ['reviews'] });
      },
    });
  };

  // Mutation for adding a comment to a review
  const useAddComment = () => {
    return useMutation<ReviewComment, Error, { reviewId: string; content: string }>({
      mutationFn: async ({ reviewId, content }) => {
        const { data } = await axios.post(`/api/reviews/${reviewId}/comments`, { content });
        return data;
      },
      onSuccess: (data, { reviewId }) => {
        // Invalidate comments query for this review to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['reviewComments', reviewId] });
        
        // Update comment count in the review
        queryClient.setQueryData<Review>(
          ['review', reviewId],
          (oldData) => {
            if (!oldData) return undefined;
            
            return {
              ...oldData,
              _count: {
                ...oldData._count,
                comments: oldData._count.comments + 1,
              },
            };
          }
        );
      },
    });
  };

  return {
    useGetReviews,
    useGetReview,
    useGetReviewComments,
    useCreateReview,
    useUpdateReview,
    useDeleteReview,
    useToggleLike,
    useAddComment,
  };
}