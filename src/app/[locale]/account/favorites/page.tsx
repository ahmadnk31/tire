'use client'

import React, { useState, useEffect } from 'react'
import { useFavorites } from '@/contexts/favorites-context'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { ImageIcon, Trash2Icon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import axios from 'axios'

// Type for product data
interface Product {
  id: string
  name: string
  images: string[]
  retailPrice: number
  salePrice?: number
  discount: number
  width: number
  aspectRatio: number
  rimDiameter: number
  speedRating: string
  brand: {
    name: string
  }
}

interface FavoriteProduct {
  id: string
  productId: string
  userId: string
  product: Product
}

export default function FavoritesPage() {
  const { favorites, removeFromFavorites, isLoading: isFavoritesLoading } = useFavorites()
  const [products, setProducts] = useState<FavoriteProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('recent')

  // Fetch product details when favorites change
  useEffect(() => {
    async function fetchProducts() {
      if (favorites.length === 0) {
        setProducts([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        // Fetch detailed favorites with product information
        const response = await axios.get('/api/favorites')
        setProducts(response.data)
      } catch (error) {
        console.error('Error fetching favorite products:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (!isFavoritesLoading) {
      fetchProducts()
    }
  }, [favorites, isFavoritesLoading])

  // Function to handle product click
  const handleProductClick = (productId: string) => {
    router.push(`/products/${productId}`)
  }

  // Function to handle removal and update UI
  const handleRemoveFavorite = async (productId: string) => {
    await removeFromFavorites(productId)
    setProducts(prev => prev.filter(p => p.productId !== productId))
  }

  // Filter products by search term
  const filteredProducts = products.filter(
    (favorite) => 
      favorite.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      favorite.product?.brand?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Sort products based on selected option
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOrder === 'price-asc') {
      return (a.product?.salePrice || a.product?.retailPrice) - (b.product?.salePrice || b.product?.retailPrice)
    } else if (sortOrder === 'price-desc') {
      return (b.product?.salePrice || b.product?.retailPrice) - (a.product?.salePrice || a.product?.retailPrice)
    } else if (sortOrder === 'name') {
      return a.product?.name?.localeCompare(b.product?.name)
    } else {
      // Default sort by recent (id or date)
      return a.id < b.id ? 1 : -1
    }
  })

  if (isLoading || isFavoritesLoading) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">My Favorites</h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading favorites...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold">My Favorites</h2>
        <p className="text-muted-foreground">
          View and manage your favorite products
        </p>
      </div>
      <Separator className="my-2" />

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-4">
        <div className="relative w-full sm:w-64">
          <Input
            placeholder="Search favorites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-3 w-full"
          />
        </div>
        <div className="flex items-center w-full sm:w-auto">
          <span className="text-sm text-muted-foreground mr-2">Sort by:</span>
          <Select
            value={sortOrder}
            onValueChange={setSortOrder}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price-asc">Price (Low to High)</SelectItem>
              <SelectItem value="price-desc">Price (High to Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-muted/20 rounded-lg p-8 mt-4">
          <div className="text-5xl mb-4 text-muted-foreground">🛞</div>
          <h3 className="text-xl font-medium mb-2">No favorites yet</h3>
          <p className="text-muted-foreground mb-6 text-center">
            You haven't added any products to your favorites yet
          </p>
          <Button asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-muted/20 rounded-lg p-8 mt-4">
          <div className="text-5xl mb-4 text-muted-foreground">🔍</div>
          <h3 className="text-xl font-medium mb-2">No results found</h3>
          <p className="text-muted-foreground mb-4">
            No products match your search criteria
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedProducts.map((favorite) => (
            <Card key={favorite.id} className="overflow-hidden">
              <div className="relative h-48 bg-muted cursor-pointer" onClick={() => handleProductClick(favorite.productId)}>
                {favorite.product.images && favorite.product.images[0] ? (
                  <Image
                    src={favorite.product.images[0]}
                    alt={favorite.product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                {favorite.product.discount > 0 && (
                  <Badge className="absolute top-2 right-2 bg-destructive hover:bg-destructive">
                    Save {favorite.product.discount}%
                  </Badge>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <h3 className="font-medium truncate flex-1 cursor-pointer" onClick={() => handleProductClick(favorite.productId)}>
                      {favorite.product.name}
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveFavorite(favorite.productId)}
                      title="Remove from favorites"
                    >
                      <Trash2Icon size={16} />
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {favorite.product.brand?.name}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {favorite.product.width}/{favorite.product.aspectRatio}R{favorite.product.rimDiameter} {favorite.product.speedRating}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {favorite.product.salePrice ? (
                      <>
                        <span className="font-semibold">{formatPrice(favorite.product.salePrice)}</span>
                        <span className="text-sm text-muted-foreground line-through">{formatPrice(favorite.product.retailPrice)}</span>
                      </>
                    ) : (
                      <span className="font-semibold">{formatPrice(favorite.product.retailPrice)}</span>
                    )}
                  </div>
                  <Button 
                    className="mt-2 w-full" 
                    onClick={() => handleProductClick(favorite.productId)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}