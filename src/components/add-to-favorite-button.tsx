"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, HeartOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";

interface AddToFavoriteButtonProps {
  productId: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showText?: boolean;
  initialIsFavorite?: boolean;
  initialFavoriteCount?: number;
}

export function AddToFavoriteButton({
  productId,
  className = "",
  variant = "outline",
  size = "default",
  showText = true,
  initialIsFavorite = false,
  initialFavoriteCount = 0,
}: AddToFavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isLoading, setIsLoading] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(initialFavoriteCount);
  const { toast } = useToast();
  const { data: session, status } = useSession();

  useEffect(() => {
    // If user is authenticated, check if this product is in their favorites
    if (status === "authenticated") {
      const checkFavoriteStatus = async () => {
        try {
          const response = await fetch(`/api/favorites/check?productId=${productId}`);
          if (response.ok) {
            const data = await response.json();
            setIsFavorite(data.isFavorite);
          }
        } catch (error) {
          console.error("Error checking favorite status:", error);
        }
      };

      checkFavoriteStatus();
    }
  }, [productId, status]);

  const toggleFavorite = async () => {
    if (status !== "authenticated") {
      toast({
        title: "Authentication required",
        description: "Please sign in to add products to favorites",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/favorites", {
        method: isFavorite ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      });

      if (response.ok) {
        const newIsFavorite = !isFavorite;
        setIsFavorite(newIsFavorite);
        setFavoriteCount(prev => newIsFavorite ? prev + 1 : Math.max(0, prev - 1));
        
        toast({
          title: newIsFavorite ? "Added to favorites" : "Removed from favorites",
          description: newIsFavorite 
            ? "This product has been added to your favorites" 
            : "This product has been removed from your favorites",
        });
      } else {
        throw new Error("Failed to update favorites");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Something went wrong",
        description: "We couldn't update your favorites. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={isLoading}
      onClick={toggleFavorite}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      {isFavorite ? (
        <Heart className="h-4 w-4 fill-current" />
      ) : (
        <Heart className="h-4 w-4" />
      )}
      {showText && (
        <span className="ml-2">
          {isFavorite ? "Saved" : "Add to Favorites"}
          {favoriteCount > 0 && ` (${favoriteCount})`}
        </span>
      )}
    </Button>
  );
}
