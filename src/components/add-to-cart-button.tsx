"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2, Check } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    retailPrice: number;
    images: string[];
    width: number;
    aspectRatio: number;
    rimDiameter: number;
    speedRating: string;
    brand: {
      name: string;
    };
    discount: number;
    salePrice?: number | null;
    stock: number;
  };
  quantity?: number;
  className?: string;
  showQuantity?: boolean;
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
}

export function AddToCartButton({
  product,
  quantity = 1,
  className = "",
  showQuantity = false,
  variant = "default",
  size = "default",
  children
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [itemQuantity, setItemQuantity] = useState(quantity);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // Update internal state when external quantity prop changes
  useEffect(() => {
    setItemQuantity(quantity);
  }, [quantity]);

  // Check if product is in stock
  const isOutOfStock = product.stock <= 0;
  
  // Calculate the final price with discount
  const finalPrice = product.salePrice !== null && product.salePrice !== undefined 
    ? product.salePrice 
    : product.discount > 0 
      ? product.retailPrice - (product.retailPrice * product.discount / 100) 
      : product.retailPrice;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    
    setIsAdding(true);
    
    // Create cart item
    const cartItem = {
      id: product.id, // Add required id property
      productId: product.id,
      name: product.name,
      price: finalPrice,
      originalPrice: product.retailPrice,
      quantity: itemQuantity,
      image: product.images[0] || "",
      width: product.width,
      aspectRatio: product.aspectRatio,
      rimDiameter: product.rimDiameter,
      speedRating: product.speedRating,
      brandName: product.brand.name,
      size: `${product.width}/${product.aspectRatio}R${product.rimDiameter}`, // Add required size property
    };
    
    // Add small delay to show loading state
    setTimeout(() => {
      addItem(cartItem);
      setIsAdding(false);
      setIsAdded(true);
      
      // Reset added state after 2 seconds
      setTimeout(() => {
        setIsAdded(false);
      }, 2000);
    }, 600);
  };
  
  // Handle quantity input change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setItemQuantity(value);
    }
  };

  // Handle increment/decrement buttons
  const incrementQuantity = () => {
    setItemQuantity(prev => Math.min(prev + 1, 20)); // Max 20 items
  };
  
  const decrementQuantity = () => {
    setItemQuantity(prev => Math.max(prev - 1, 1)); // Min 1 item
  };

  if (isOutOfStock) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            className={className} 
            variant="outline" 
            size={size} 
            disabled
          >
            Out of Stock
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>This product is currently out of stock</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className={`flex flex-col w-full ${showQuantity ? 'space-y-2' : ''}`}>
      {showQuantity && (
        <div className="flex items-center w-full">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-r-none"
            onClick={decrementQuantity}
            disabled={itemQuantity <= 1 || isAdding}
          >
            -
          </Button>
          <input
            type="number"
            min="1"
            max="20"
            value={itemQuantity}
            onChange={handleQuantityChange}
            className="h-8 w-12 border border-x-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            disabled={isAdding}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-l-none"
            onClick={incrementQuantity}
            disabled={itemQuantity >= 20 || isAdding}
          >
            +
          </Button>
        </div>
      )}
      
      <Button
        className={className}
        variant={variant}
        size={size}
        onClick={handleAddToCart}
        disabled={isAdding || isOutOfStock}
      >
        {isAdding ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : isAdded ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Added
          </>
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" />
            {children || "Add to Cart"}
          </>
        )}
      </Button>
    </div>
  );
}