'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useCart } from '@/contexts/cart-context'
import { Button } from './ui/button'
import { Trash2, Plus, Minus, ShoppingCartIcon, } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ScrollArea } from './ui/scroll-area'
import { Skeleton } from './ui/skeleton'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { formatPrice } from '@/lib/utils'

export function CartQuickView() {  const { items, removeItem, updateItemQuantity, summary } = useCart()
  const t = useTranslations('cart')
  const locale = useLocale()
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const subtotal = summary?.subtotal || 0

  // Handle quantity changes with loading state
  const handleQuantityChange = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return
    setLoading(prev => ({ ...prev, [id]: true }))
    
    try {
      await updateItemQuantity(id, newQuantity)
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }))
    }
  }

  // Handle item removal with loading state
  const handleRemoveItem = async (id: string) => {
    setLoading(prev => ({ ...prev, [id]: true }))
    
    try {
      await removeItem(id)
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }))
    }
  }
  if (items.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center justify-center">
        <div className="text-center space-y-3">
          <ShoppingCartIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <h3 className="text-lg font-medium">{t('empty')}</h3>
          <p className="text-sm text-muted-foreground">{t('emptyMessage')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full py-4 px-4">
      {/* Cart items */}
      <ScrollArea className="flex-1 -mx-6 px-6">
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center space-x-4 py-2 border-b last:border-0"
            >
              {/* Product Image */}
              <div className="relative h-16 w-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
              </div>
              
              {/* Product details */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/${locale}/products/${item.productId}`}
                  className="text-sm font-medium truncate hover:underline"
                >
                  {item.name}
                </Link>
                
                <div className="flex items-baseline mt-1">
                  <span className="text-sm font-medium">
                    {formatPrice(item.price)}
                  </span>
                  {item.originalPrice && item.originalPrice > item.price && (
                    <span className="text-xs text-muted-foreground line-through ml-2">
                      {formatPrice(item.originalPrice)}
                    </span>
                  )}
                </div>
                
                {/* Product size information */}
                {item.size && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.size}
                  </p>
                )}
              </div>
              
              {/* Quantity controls and remove button */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center rounded-md border">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-none"
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1 || loading[item.id]}
                  >
                    <Minus className="h-3 w-3" />
                    <span className="sr-only">Decrease</span>
                  </Button>
                  
                  <span className="flex items-center justify-center w-8 text-center text-sm">
                    {loading[item.id] ? (
                      <Skeleton className="h-4 w-4" />
                    ) : (
                      item.quantity
                    )}
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-none"
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    disabled={loading[item.id]}
                  >
                    <Plus className="h-3 w-3" />
                    <span className="sr-only">Increase</span>
                  </Button>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={loading[item.id]}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {/* Cart summary */}
      <div className="border-t pt-4 mt-4 px-2 md:px-4 lg:px-8">
        <div className="flex justify-between text-sm mb-2">
          <span>{t('subtotal')}</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('shippingNote')}
        </p>
      </div>
    </div>
  )
}

// Fallback icon components in case they're needed
function ShoppingCart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  )
}

function ImageIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  )
}
