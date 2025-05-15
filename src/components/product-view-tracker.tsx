"use client";

import { useEffect } from "react";
import { useRecentProducts } from "@/hooks/use-cookies";

interface ProductViewTrackerProps {
  /** Product ID to track */
  productId: string;
  /** Maximum number of recently viewed products to store (default: 10) */
  maxItems?: number;
  /** Children components */
  children: React.ReactNode;
}

/**
 * Component that tracks product views and stores them in cookies
 * Wrap a product detail page or component with this to automatically
 * add the product to recently viewed products list
 */
export function ProductViewTracker({
  productId,
  maxItems = 10,
  children
}: ProductViewTrackerProps) {
  const { addProduct } = useRecentProducts(maxItems);

  // Track the product view when the component mounts
  useEffect(() => {
    if (productId) {
      addProduct(productId);
    }
  }, [productId, addProduct]);

  // Just render children with no wrapper
  return <>{children}</>;
} 