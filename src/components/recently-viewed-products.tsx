"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useRecentProducts } from "@/hooks/use-cookies";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";

// Define a minimal product interface
interface ProductPreview {
  id: string;
  name: string;
  images: string[];
  retailPrice: number;
  salePrice: number | null;
  brand: { name: string };
}

/**
 * Component properties
 */
interface RecentlyViewedProductsProps {
  /** Maximum number of products to display */
  limit?: number;
  /** Title for the section */
  title?: string;
  /** Text to show when no products have been viewed */
  emptyText?: string;
  /** Function to get product details by ID */
  getProductDetails?: (id: string) => Promise<ProductPreview>;
}

/**
 * Component to display recently viewed products
 */
export function RecentlyViewedProducts({
  limit = 4,
  title = "Recently Viewed",
  emptyText = "You haven't viewed any products yet",
  getProductDetails = defaultGetProductDetails,
}: RecentlyViewedProductsProps) {
  const { locale } = useParams();
  const { recentProducts } = useRecentProducts(limit);
  const [products, setProducts] = useState<ProductPreview[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch product details for the IDs in the cookie
  useEffect(() => {
    const fetchProducts = async () => {
      if (recentProducts.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const productDetails = await Promise.all(
          recentProducts.map((id) => getProductDetails(id))
        );
        
        // Filter out any null results (products that couldn't be fetched)
        setProducts(productDetails.filter(Boolean) as ProductPreview[]);
      } catch (error) {
        console.error("Error fetching recently viewed products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [recentProducts, getProductDetails]);

  // Don't render anything if there are no products and we're not loading
  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array(limit).fill(0).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden group transition-shadow hover:shadow-md">
              <Link href={`/${locale}/products/${product.id}`} className="block">
                <div className="h-40 bg-gray-100 relative flex items-center justify-center p-3">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      width={120}
                      height={120}
                      className="object-contain max-h-full transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full bg-gray-100 text-gray-400 text-xs">
                      No image
                    </div>
                  )}
                  
                  {product.salePrice && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs font-bold rounded">
                      SALE
                    </div>
                  )}
                </div>
                
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{product.brand.name}</p>
                  
                  <div className="mt-auto">
                    {product.salePrice ? (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{formatPrice(product.salePrice)}</span>
                        <span className="text-xs text-gray-500 line-through">{formatPrice(product.retailPrice)}</span>
                      </div>
                    ) : (
                      <span className="font-bold text-sm">{formatPrice(product.retailPrice)}</span>
                    )}
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">{emptyText}</p>
      )}
    </div>
  );
}

/**
 * Default function to fetch product details
 * Replace with your own implementation if needed
 */
async function defaultGetProductDetails(id: string): Promise<ProductPreview | null> {
  try {
    const response = await fetch(`/api/products/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    return null;
  }
} 