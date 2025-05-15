"use client";

import { ProductViewTracker } from "@/components/product-view-tracker";
import { RecentlyViewedProducts } from "@/components/recently-viewed-products";

interface ClientProductPageProps {
  /** Product ID to track */
  productId: string;
  /** Main content of the page */
  children: React.ReactNode;
}

/**
 * Client-side wrapper for the product detail page
 * Handles product view tracking and showing recently viewed products
 */
export function ClientProductPage({ productId, children }: ClientProductPageProps) {
  return (
    <ProductViewTracker productId={productId}>
      {children}
      <div className="container mx-auto px-4 mt-12">
        <RecentlyViewedProducts />
      </div>
    </ProductViewTracker>
  );
} 