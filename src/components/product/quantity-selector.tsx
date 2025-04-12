'use client'

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QuantitySelectorProps {
  initialValue?: number
  min?: number
  max?: number
  onChange?: (quantity: number) => void
  disabled?: boolean
}

export function QuantitySelector({ 
  initialValue = 1, 
  min = 1,
  max = 999,
  onChange,
  disabled = false
}: QuantitySelectorProps) {
  const [quantity, setQuantity] = useState(initialValue)

  const handleIncrement = () => {
    if (quantity < max) {
      const newValue = quantity + 1
      setQuantity(newValue)
      onChange?.(newValue)
    }
  }

  const handleDecrement = () => {
    if (quantity > min) {
      const newValue = quantity - 1
      setQuantity(newValue)
      onChange?.(newValue)
    }
  }

  return (
    <div className="flex items-center">
      <Button 
        variant="outline" 
        size="icon" 
        onClick={handleDecrement}
        disabled={quantity <= min || disabled}
        aria-label="Decrease quantity"
      >
        <Minus className="w-4 h-4" />
      </Button>
      
      <span className="text-xl font-semibold px-6">{quantity}</span>
      
      <Button 
        variant="outline" 
        size="icon" 
        onClick={handleIncrement}
        disabled={quantity >= max || disabled}
        aria-label="Increase quantity"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  )
}