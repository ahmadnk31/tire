"use client";

import { usePromotion } from "@/contexts/promotion-context";
import { formatPromotionValue, getBadgeVariant } from "@/hooks/use-promotions";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

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
    slug?: string;
  };
  onAddToCart?: () => void;
}

export function ProductCardWithPromotion({ product, onAddToCart }: ProductCardProps) {
  const { activePromotions } = usePromotion();
  
  // Find applicable promotions for this product
  const applicablePromotions = activePromotions.filter(promotion => {
    // Check if this product is eligible for the promotion
    const productMatches = promotion.products?.some(p => p.id === product.id);
    const brandMatches = promotion.brands?.some(b => b.id === product.brandId);
    const categoryMatches = promotion.categories?.some(c => c.id === product.categoryId);
    const modelMatches = promotion.models?.some(m => m.id === product.modelId);
    
    return productMatches || brandMatches || categoryMatches || modelMatches;
  });

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-background p-2 transition-all hover:shadow-md">
      {/* Product image */}
      <Link href={`/products/${product.id}`} className="relative block aspect-square overflow-hidden rounded-md">
        {product.images && product.images[0] ? (
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

      {/* Promotion badges */}
      {applicablePromotions.length > 0 && (
        <div className="absolute top-3 right-3 space-y-1 z-10">
          {applicablePromotions.map(promotion => (
            <Badge 
              key={promotion.id} 
              className={`${getBadgeVariant(promotion.colorScheme)} font-medium px-2 py-0.5`}
            >
              {formatPromotionValue(promotion.type, promotion.value)}
            </Badge>
          ))}
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
            onClick={onAddToCart}
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
