"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  const t = useTranslations("productGrid");
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // This will use your actual API endpoint
        const response = await fetch(`/api/products?${searchParams.toString()}`);
        if (!response.ok) {
          throw new Error(`Error fetching products: ${response.status}`);
        }
        const data = await response.json();
        setProducts(data.products || []);
        setTotalProducts(data.total || 0);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [searchParams]);
  
  if (loading) {
    return <ProductsLoadingSkeleton />;
  }
  
  if (products.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium">{t("noProducts.title")}</h3>
        <p className="text-gray-500 mt-2">{t("noProducts.description")}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        {t("showing", { count: products.length, total: totalProducts })}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const t = useTranslations("productGrid.productCard");
  
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
        <Link href={`/products/${product.id}`}>
          <div className="h-48 bg-gray-100 relative cursor-pointer">
            {product.images && product.images.length > 0 ? (
              <Image 
                src={product.images[0]} 
                alt={product.name}
                fill
                style={{ objectFit: "contain" }}
                className="p-4"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                {t("noImage")}
              </div>
            )}
            {hasDiscount && (
              <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs font-bold rounded">
                {t("discount", { discount: product.discount })}
              </div>
            )}
            {product.runFlat && (
              <div className="absolute bottom-2 left-2">
                <Badge variant="outline" className="bg-white">{t("runFlat")}</Badge>
              </div>
            )}
            {isLowStock && (
              <div className="absolute bottom-2 right-2">
                <Badge variant="outline" className="bg-white text-amber-600">{t("lowStock")}</Badge>
              </div>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{t("outOfStock")}</span>
              </div>
            )}
          </div>
        </Link>
      </div>
      
      <CardContent className="p-4 flex-grow">
        <div className="mb-1">
          <span className="text-sm font-medium text-gray-500">{product.brand.name}</span>
        </div>
        <Link href={`/products/${product.id}`} className="hover:underline">
          <h3 className="font-bold text-lg leading-tight">{product.name}</h3>
        </Link>
        
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary">{product.tireType.replace('_', ' ')}</Badge>
          <Badge variant="outline">{tireSize}</Badge>
          <Badge variant="outline">{loadSpeedSpec}</Badge>
        </div>
        
        {/* Performance ratings as icons */}
        <div className="flex mt-3 space-x-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-full">
                  <span className="text-blue-600 font-semibold text-xs">{product.wetGrip}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("performance.wetGrip")}: {t(`performance.ratings.${product.wetGrip}`, { fallback: product.wetGrip })}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center justify-center w-8 h-8 bg-green-50 rounded-full">
                  <span className="text-green-600 font-semibold text-xs">{product.fuelEfficiency}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("performance.fuelEfficiency")}: {t(`performance.ratings.${product.fuelEfficiency}`, { fallback: product.fuelEfficiency })}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center justify-center w-8 h-8 bg-gray-50 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 text-gray-600">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 01-.707-.707m-.707-.707a9 9 0 010-12.728" />
                  </svg>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("performance.noiseLevel")}: {product.noiseLevel}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Technical specs in expandable accordion */}
        <Accordion type="single" collapsible className="mt-2">
          <AccordionItem value="specs" className="border-t border-t-gray-200">
            <AccordionTrigger className="py-2 text-sm font-medium">
              {t("specifications")}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">{t("specs.treadDepth")}:</span>
                  <span className="ml-1">{product.treadDepth}mm</span>
                </div>
                <div>
                  <span className="text-gray-500">{t("specs.sidewall")}:</span>
                  <span className="ml-1">{product.sidewallType}</span>
                </div>
                <div>
                  <span className="text-gray-500">{t("specs.treadPattern")}:</span>
                  <span className="ml-1">{product.treadPattern}</span>
                </div>
                {product.snowRating && (
                  <div>
                    <span className="text-gray-500">{t("specs.snowRating")}:</span>
                    <span className="ml-1">{product.snowRating}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">{t("specs.utqg")}:</span>
                  <span className="ml-1">{product.treadwear}/{product.traction}/{product.temperature}</span>
                </div>
                {product.mileageWarranty && (
                  <div>
                    <span className="text-gray-500">{t("specs.warranty")}:</span>
                    <span className="ml-1">
                      {t("specs.warrantyMiles", { miles: product.mileageWarranty.toLocaleString() })}
                    </span>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 mt-auto">
        <div className="w-full">
          <div className="flex items-center justify-between mb-3">
            <div>
              {hasDiscount ? (
                <div>
                  <span className="text-lg font-bold">${finalPrice.toFixed(2)}</span>
                  <span className="text-gray-500 text-sm ml-2 line-through">${product.retailPrice.toFixed(2)}</span>
                </div>
              ) : (
                <span className="text-lg font-bold">${product.retailPrice.toFixed(2)}</span>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {product.stock > 0 ? 
                t("inStock", { count: product.stock }) : 
                t("outOfStock")
              }
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <AddToCartButton 
              product={product}
              size="sm"
              className="w-full"
            />
            <Link href={`/products/${product.id}`} className="w-full">
              <Button size="sm" variant="outline" className="w-full">
                {t("buttons.viewDetails")}
              </Button>
            </Link>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

function ProductsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="h-48 bg-gray-200 animate-pulse" />
          <CardContent className="p-4 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="flex space-x-2">
              <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
              <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
          </CardContent>
          <CardFooter className="p-4 space-y-2">
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}