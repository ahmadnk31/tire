'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useFavorites } from '@/contexts/favorites-context'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface FavoriteButtonProps {
  productId: string
  variant?: "icon" | "default"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function FavoriteButton({ 
  productId, 
  variant = "icon", 
  size = "icon", 
  className 
}: FavoriteButtonProps) {
  const { isFavorite, addToFavorites, removeFromFavorites, isLoading } = useFavorites()
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const isFav = isFavorite(productId)
  
  const handleClick = async () => {
    // If user is not logged in and we want to add to favorites, show login dialog
    if (!session && !isFav) {
      setIsLoginDialogOpen(true)
      return
    }
    
    if (isFav) {
      await removeFromFavorites(productId)
    } else {
      await addToFavorites(productId)
    }
  }

  if (variant === "icon") {
    return (
      <>
        <Button
          variant="outline"
          size={size}
          className={cn(
            "text-gray-500 border-gray-200",
            isFav ? "text-red-500 hover:text-red-700 hover:border-red-200" : "hover:text-black",
            isLoading && "opacity-50 cursor-wait",
            className
          )}
          onClick={handleClick}
          disabled={isLoading}
          aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart className={cn("w-6 h-6", isFav && "fill-current")} />
          <span className="sr-only">{isFav ? "Remove from favorites" : "Add to favorites"}</span>
        </Button>
        
        <LoginDialog 
          open={isLoginDialogOpen} 
          onOpenChange={setIsLoginDialogOpen} 
          onLogin={() => router.push('/auth/login?callbackUrl=' + encodeURIComponent(window.location.href))}
          onCancel={() => setIsLoginDialogOpen(false)}
        />
      </>
    )
  }

  return (
    <>
      <Button
        variant={isFav ? "destructive" : "outline"}
        size={size}
        className={cn(
          isLoading && "opacity-50 cursor-wait",
          className
        )}
        onClick={handleClick}
        disabled={isLoading}
      >
        <Heart className={cn("w-5 h-5 mr-2", isFav && "fill-current")} />
        {isFav ? "Remove from Favorites" : "Add to Favorites"}
      </Button>
      
      <LoginDialog 
        open={isLoginDialogOpen} 
        onOpenChange={setIsLoginDialogOpen} 
        onLogin={() => router.push('/auth/login?callbackUrl=' + encodeURIComponent(window.location.href))}
        onCancel={() => setIsLoginDialogOpen(false)}
      />
    </>
  )
}

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLogin: () => void
  onCancel: () => void
}

function LoginDialog({ open, onOpenChange, onLogin, onCancel }: LoginDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign in to save favorites</DialogTitle>
          <DialogDescription>
            You need to be signed in to save items to your favorites. Would you like to sign in now?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            Not now
          </Button>
          <Button onClick={onLogin}>
            Sign in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}