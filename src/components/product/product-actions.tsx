'use client'

import { useState } from 'react'
import { QuantitySection } from './quantity-section'
import { AddToCartButton } from '@/components/add-to-cart-button'
import { FavoriteButton } from './favorite-button'
import { useTranslations } from 'next-intl'

interface ProductActionsProps {
  product: {
    id: string
    name: string
    images: string[]
    retailPrice: number
    discount: number
    salePrice?: number | null
    stock: number
    width: number
    aspectRatio: number
    rimDiameter: number
    speedRating: string
    brand: {
      name: string
    }
  }
  totalStock: number
}

export function ProductActions({ product, totalStock }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1)
  const t=useTranslations('ProductDetails')
  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity)
  }

  return (
    <>
      {/* Quantity Selection */}
      <QuantitySection totalStock={totalStock} onChange={handleQuantityChange} />

      {/* Add to Cart and Wishlist */}
      <div className="flex space-x-4">
        <AddToCartButton 
          product={product}
          quantity={quantity}
          className="flex-1"
        />
        <FavoriteButton productId={product.id} variant="default" size="default" addToFavoritesText={t('addToFavorites')} removeFromFavoritesText={t('removeFromFavorites')} />
      </div>
    </>
  )
}