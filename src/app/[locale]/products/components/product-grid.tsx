"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/components/add-to-cart-button";

// Product interface based on your Prisma schema
interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  // Brand and categorization
  brandId: string;
  brand: {
    name: string;
    logoUrl: string | null;
  };
  modelId: string;
  model: {
    name: string;
  };
  categoryId: string;
  category: {
    name: string;
  };
  
  // Tire specifications
  width: number;
  aspectRatio: number;
  rimDiameter: number;
  loadIndex: number;
  speedRating: string;
  constructionType: string | null;
  treadDepth: number;
  sidewallType: string;
  tireType: string;
  runFlat: boolean;
  reinforced: boolean;
  
  // Performance characteristics
  treadPattern: string;
  wetGrip: string;
  fuelEfficiency: string;
  noiseLevel: string;
  snowRating: string;
  treadwear: number;
  traction: string;
  temperature: string;
  
  // Additional specifications
  mileageWarranty: number | null;
  plyRating: number;
  maxInflationPressure: number | null;
  maxLoad: number | null;
  
  // Business information
  retailPrice: number;
  wholesalePrice: number;
  discount: number;
  retailerDiscount: number;
  salePrice: number | null;
  wholesaleSalePrice: number | null;
  stock: number;
  manufacturerPartNumber: string;
  certifications: string;
  countryOfOrigin: string;
  
  // Media
  images: string[]; 
  
  // Metadata
  isVisible: boolean;
  isFeatured: boolean;
  isDiscontinued: boolean;
  createdAt: string;
  updatedAt: string;
}

export function ProductGrid() {
  const t = useTranslations("Products");
  const { locale } = useParams();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const perPage = 12;

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Create a URLSearchParams object with the current search params
        const params = new URLSearchParams(searchParams);
        // Add pagination parameters
        params.set('page', currentPage.toString());
        params.set('perPage', perPage.toString());
        
        const response = await fetch(`/api/products?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        setProducts(data.products);
        setTotalCount(data.totalCount);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [searchParams, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top on page change
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (loading) {
    return <ProductsLoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <h3 className="text-xl font-semibold mb-2">{t("results.empty")}</h3>
        <p className="text-muted-foreground mb-6">
          Try changing your filters or search criteria
        </p>
        <Button 
          onClick={() => window.location.href = '/products'} 
          variant="outline"
        >
          {t("filters.clear")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {t("results.found", { count: totalCount })}
        </p>
      </div>
      
      {/* Products grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="hidden sm:flex"
            >
              <span className="sr-only">{t("pagination.prev")}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="sm:hidden px-2"
            >
              {t("pagination.prev")}
            </Button>

            <div className="flex items-center gap-x-1.5 mx-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show nearby pages and first/last pages
                const showPage = 
                  page === 1 || 
                  page === totalPages || 
                  Math.abs(page - currentPage) <= 1;
                
                if (!showPage) {
                  // Show ellipsis for skipped pages
                  if (page === 2 || page === totalPages - 1) {
                    return <span key={`ellipsis-${page}`} className="px-2">...</span>;
                  }
                  return null;
                }
                
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="hidden sm:flex"
            >
              <span className="sr-only">{t("pagination.next")}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="sm:hidden px-2"
            >
              {t("pagination.next")}
            </Button>
          </nav>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const t = useTranslations("Products.product");
  const { locale } = useParams();
  
  // Calculate the discounted price if there's a discount
  const hasDiscount = product.discount > 0;
  const finalPrice = hasDiscount
    ? product.salePrice !== null
      ? product.salePrice
      : product.retailPrice - (product.retailPrice * product.discount / 100)
    : product.retailPrice;
  
  // Formatted tire size (e.g., 225/65R17)
  const tireSize = `${product.width}/${product.aspectRatio}R${product.rimDiameter}`;
  
  // Format the specification string (e.g., 95H)
  const loadSpeedSpec = `${product.loadIndex}${product.speedRating}`;
  
  // Stock status
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock === 0;
  
  return (
    <Card className="overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow">
      <div className="relative">
        <Link href={`/${locale}/products/${product.id}`}>
          <div className="h-48 bg-gray-100 relative cursor-pointer">
            {product.images && product.images.length > 0 ? (
              <Image 
                src={product.images[0]} 
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{ objectFit: "contain" }}
                className="p-4"
                priority={false}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                {t("noImage")}
              </div>
            )}
            {hasDiscount && (
              <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs font-bold rounded">
                {t("sale", { discount: product.discount })}
              </div>
            )}
            {product.runFlat && (
              <div className="absolute bottom-2 left-2">
                <Badge variant="secondary" className="text-xs bg-blue-100">Run Flat</Badge>
              </div>
            )}
          </div>
        </Link>
      </div>
      
      <CardContent className="flex-grow space-y-3 p-4">
        <div>
          <Link href={`/${locale}/products/${product.id}`} className="hover:underline">
            <h3 className="font-medium line-clamp-2 text-sm sm:text-base">{product.name}</h3>
          </Link>
          <p className="text-xs text-muted-foreground mt-1">{product.brand.name} • {tireSize}</p>
        </div>
        
        <div className="text-sm flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="bg-gray-50">
            {product.tireType.replace(/_/g, ' ')}
          </Badge>
          <Badge variant="outline" className="bg-gray-50">
            {loadSpeedSpec}
          </Badge>
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            {hasDiscount ? (
              <div>
                <span className="font-medium text-lg">${finalPrice.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground line-through ml-2">
                  ${product.retailPrice.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="font-medium text-lg">${product.retailPrice.toFixed(2)}</span>
            )}
          </div>
          
          <div>
            {isOutOfStock ? (
              <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
                {t("outOfStock")}
              </Badge>
            ) : isLowStock ? (
              <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50">
                {t("lowStock")}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-green-500 border-green-200 bg-green-50">
                {t("inStock")}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 pb-4 px-4">
        <div className="grid grid-cols-2 gap-2 w-full">
          <Link href={`/${locale}/products/${product.id}`} className="w-full">
            <Button variant="outline" size="sm" className="w-full text-xs h-9">
              {t("viewDetails")}
            </Button>
          </Link>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <AddToCartButton 
                    product={product} 
                   quantity={product.stock}
                   showQuantity={true}
                    className="w-full text-xs h-9"
                    size="sm"
                  >
                    {t("addToCart")}
                  </AddToCartButton>
                </div>
              </TooltipTrigger>
              {isOutOfStock && (
                <TooltipContent>
                  <p>{t("outOfStock")}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardFooter>
    </Card>
  );
}

function ProductsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="border rounded-lg overflow-hidden h-full">
          <div className="h-48 bg-gray-200 animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded w-20 animate-pulse" />
              <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />
              <div className="h-5 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="h-9 bg-gray-200 rounded animate-pulse" />
              <div className="h-9 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}