'use client'

import { useState } from 'react'
import { QuantitySelector } from './quantity-selector'

interface QuantitySectionProps {
  totalStock: number
  initialQuantity?: number
  onChange?: (quantity: number) => void
}

export function QuantitySection({ 
  totalStock, 
  initialQuantity = 1, 
  onChange 
}: QuantitySectionProps) {
  const [quantity, setQuantity] = useState(initialQuantity)
  const isOutOfStock = totalStock <= 0
  
  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity)
    // Propagate the quantity change to the parent component if onChange is provided
    if (onChange) {
      onChange(newQuantity)
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Quantity</h3>
      <div className="flex items-center space-x-4">
        <QuantitySelector 
          initialValue={quantity} 
          min={1} 
          max={totalStock} 
          onChange={handleQuantityChange}
          disabled={isOutOfStock}
        />
        <span className="text-sm text-gray-500">
          {totalStock} {totalStock === 1 ? 'tire' : 'tires'} available
        </span>
      </div>
    </div>
  )
}