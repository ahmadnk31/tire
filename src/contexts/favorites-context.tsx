'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import axios from 'axios'

type FavoritesContextType = {
  favorites: string[]
  isLoading: boolean
  addToFavorites: (productId: string) => Promise<void>
  removeFromFavorites: (productId: string) => Promise<void>
  isFavorite: (productId: string) => boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [favorites, setFavorites] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load favorites from localStorage or API when component mounts
  useEffect(() => {
    async function loadFavorites() {
      setIsLoading(true)
      try {
        if (session?.user) {
          // If user is logged in, load favorites from API
          const response = await axios.get('/api/favorites')
          setFavorites(response.data.map((fav: any) => fav.productId))
        } else {
          // If user is not logged in, load favorites from localStorage
          const storedFavorites = localStorage.getItem('favorites')
          if (storedFavorites) {
            setFavorites(JSON.parse(storedFavorites))
          }
        }
      } catch (error) {
        console.error('Error loading favorites:', error)
        toast.error('Failed to load favorites')
      } finally {
        setIsLoading(false)
      }
    }

    loadFavorites()
  }, [session])

  // Save favorites to localStorage when they change
  useEffect(() => {
    if (!session?.user && favorites.length > 0) {
      localStorage.setItem('favorites', JSON.stringify(favorites))
    }
  }, [favorites, session])

  // Add product to favorites
  const addToFavorites = async (productId: string) => {
    try {
      if (session?.user) {
        // If user is logged in, save to API
        await axios.post('/api/favorites', { productId })
      }
      
      setFavorites((prev) => [...prev, productId])
      toast.success('Added to favorites')
    } catch (error) {
      console.error('Error adding to favorites:', error)
      toast.error('Failed to add to favorites')
    }
  }

  // Remove product from favorites
  const removeFromFavorites = async (productId: string) => {
    try {
      if (session?.user) {
        // If user is logged in, delete from API
        await axios.delete(`/api/favorites/${productId}`)
      }
      
      setFavorites((prev) => prev.filter(id => id !== productId))
      toast.success('Removed from favorites')
    } catch (error) {
      console.error('Error removing from favorites:', error)
      toast.error('Failed to remove from favorites')
    }
  }

  // Check if a product is in favorites
  const isFavorite = (productId: string) => {
    return favorites.includes(productId)
  }

  return (
    <FavoritesContext.Provider 
      value={{ 
        favorites, 
        isLoading, 
        addToFavorites, 
        removeFromFavorites, 
        isFavorite 
      }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}