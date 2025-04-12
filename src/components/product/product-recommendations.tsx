'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

// Define the Product interface based on the data we need
interface RecommendedProduct {
  id: string;
  name: string;
  images: string[];
  width: number;
  aspectRatio: number;
  rimDiameter: number;
  retailPrice: number;
  discount: number;
  salePrice: number | null;
  brand: {
    name: string;
  };
  _count: {
    reviews: number;
  };
  averageRating?: number; // This might come from the API
}

interface ProductRecommendationsProps {
  productId: string;
  categoryId: string;
  brandId: string;
  tireSpecs: {
    width: number;
    aspectRatio: number;
    rimDiameter: number;
  };
  limit?: number;
}

export function ProductRecommendations({
  productId,
  categoryId,
  brandId,
  tireSpecs,
  limit = 4,
}: ProductRecommendationsProps) {
  const { locale } = useParams();
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        
        // Fetch similar products
        const response = await fetch(`/api/products/recommendations?productId=${productId}&categoryId=${categoryId}&brandId=${brandId}&width=${tireSpecs.width}&aspectRatio=${tireSpecs.aspectRatio}&rimDiameter=${tireSpecs.rimDiameter}&limit=${limit}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch product recommendations");
        }
        
        const data = await response.json();
        setRecommendations(data);
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setError("Could not load product recommendations");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [productId, categoryId, brandId, tireSpecs, limit]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(limit).fill(0).map((_, i) => (
          <Card key={i} className="border shadow-sm">
            <div className="aspect-square relative bg-gray-100">
              <Skeleton className="h-full w-full" />
            </div>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <Skeleton className="h-5 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-gray-500">{error}</div>;
  }

  if (recommendations.length === 0) {
    return <div className="text-center py-8 text-gray-500">No similar products found</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {recommendations.map((product) => {
        // Calculate the discounted price if there's a discount
        const hasDiscount = product.discount > 0;
        const finalPrice = hasDiscount
          ? product.salePrice !== null
            ? product.salePrice
            : product.retailPrice - (product.retailPrice * product.discount / 100)
          : product.retailPrice;

        // Format tire size
        const tireSize = `${product.width}/${product.aspectRatio}R${product.rimDiameter}`;
        
        return (
          <Link 
            href={`/${locale}/products/${product.id}`} 
            key={product.id}
            className="group"
          >
            <Card className="border shadow-sm transition-shadow hover:shadow-md overflow-hidden">
              <div className="aspect-square relative bg-gray-50">
                {product.images && product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
              </div>
              
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 mb-1">{product.brand.name}</p>
                <h3 className="font-medium line-clamp-2 mb-2">{product.name}</h3>
                <Badge variant="outline" className="mb-2">{tireSize}</Badge>
                
                <div className="flex items-center mb-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= Math.round(product.averageRating || 0)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 ml-1">
                    ({product._count.reviews})
                  </span>
                </div>
              </CardContent>
              
              <CardFooter className="p-4 pt-0 flex justify-between items-center">
                <div className="flex items-baseline">
                  {hasDiscount ? (
                    <>
                      <span className="text-lg font-bold">${finalPrice.toFixed(2)}</span>
                      <span className="text-sm text-gray-500 line-through ml-2">
                        ${product.retailPrice.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-bold">${product.retailPrice.toFixed(2)}</span>
                  )}
                </div>
              </CardFooter>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
