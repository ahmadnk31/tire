"use client";

import { usePromotion } from "@/contexts/promotion-context";
import { formatPromotionValue, getBadgeVariant } from "@/hooks/use-promotions";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

interface Promotion {
  id: string;
  type: string;
  value: number | string;
  colorScheme: string;
  products?: Array<{ id: string }>;
  brands?: Array<{ id: string }>;
  categories?: Array<{ id: string }>;
  models?: Array<{ id: string }>;
}

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    brandId: string;
    categoryId: string;
    modelId?: string;
    price: number;
    originalPrice?: number;
    images?: string[];
  };
  onAddToCart: (productId: string) => void;
}

/**
 * Product card component that displays product information with applicable promotions
 */
export function ProductCardWithPromotion({ product, onAddToCart }: ProductCardProps) {
  const { activePromotions } = usePromotion();
  
  // Find applicable promotions for this product
  const applicablePromotions = activePromotions.filter((promotion: Promotion) => {
    // Check if this product is eligible for the promotion
    const productMatches = promotion.products?.some(p => p.id === product.id) || false;
    const brandMatches = promotion.brands?.some(b => b.id === product.brandId) || false;
    const categoryMatches = promotion.categories?.some(c => c.id === product.categoryId) || false;
    const modelMatches = product.modelId ? promotion.models?.some(m => m.id === product.modelId) || false : false;
    
    return productMatches || brandMatches || categoryMatches || modelMatches;
  });

  // Handle add to cart with product id
  const handleAddToCart = () => {
    onAddToCart(product.id);
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-background p-2 transition-all hover:shadow-md">
      {/* Product image */}
      <Link href={`/products/${product.id}`} className="relative block aspect-square overflow-hidden rounded-md">
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary/20">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
      </Link>

      {/* Promotion badges - limit to max 2 badges for cleaner UI */}
      {applicablePromotions.length > 0 && (
        <div className="absolute top-3 right-3 space-y-1 z-10">
          {applicablePromotions.slice(0, 2).map(promotion => (
            <Badge 
              key={promotion.id} 
              variant="outline"
              className={`${getBadgeVariant(promotion.colorScheme)} font-medium px-2 py-0.5`}
            >
              {formatPromotionValue(promotion.type, promotion.value)}
            </Badge>
          ))}
          {applicablePromotions.length > 2 && (
            <Badge variant="outline" className="bg-gray-100 text-gray-800 font-medium px-2 py-0.5">
              +{applicablePromotions.length - 2} more
            </Badge>
          )}
        </div>
      )}

      {/* Product info */}
      <div className="pt-3 space-y-1">
        <h3 className="font-medium line-clamp-1 leading-tight">
          <Link href={`/products/${product.id}`} className="hover:underline">
            {product.name}
          </Link>
        </h3>

        <div className="flex items-end justify-between">
          <div>
            {/* Price display with potential discount from original price */}
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-primary">
                ${product.price.toFixed(2)}
              </p>
              {product.originalPrice && product.price < product.originalPrice && (
                <p className="text-sm text-muted-foreground line-through">
                  ${product.originalPrice.toFixed(2)}
                </p>
              )}
            </div>
          </div>

          {/* Add to cart button */}
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 rounded-full px-3"
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
      </div>
    </div>
  );
}