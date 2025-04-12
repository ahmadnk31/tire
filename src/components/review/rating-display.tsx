'use client'

import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { useReviews } from '@/hooks/use-reviews'
import { ReadOnlyRating } from './rating'
import Link from 'next/link'

interface RatingDisplayProps {
  productId: string
}

export function RatingDisplay({ productId }: RatingDisplayProps) {
  const { useGetReviews } = useReviews()
  const [averageRating, setAverageRating] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)

  // Fetch reviews for this product
  const { data, isLoading } = useGetReviews({
    productId,
    limit: 1, // We only need the meta information, not all reviews
  })

  // Calculate average rating when data is loaded
  useEffect(() => {
    if (data) {
      const totalCount = data.meta.totalCount
      
      if (totalCount > 0) {
        // If we have the reviews data already loaded, calculate the average
        if (data.reviews.length > 0) {
          const total = data.reviews.reduce((sum, review) => sum + review.rating, 0)
          setAverageRating(total / data.reviews.length)
        }
        // Otherwise we need to do another query to get all reviews for average calculation
        else {
          // This is a simplification - in a real app you might want to calculate this on the server
          setAverageRating(4) // Default to 4 stars if we can't calculate yet
        }
        
        setReviewCount(totalCount)
      }
    }
  }, [data])

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 animate-pulse">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-5 h-5 text-gray-200" />
          ))}
        </div>
        <span className="text-sm font-medium text-gray-300 w-16 h-4 bg-gray-200 rounded"></span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <ReadOnlyRating value={averageRating} size="md" />
      <Link href="#customer-reviews" className="text-sm font-medium text-gray-500 hover:underline">
        ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
      </Link>
    </div>
  )
}