"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategory, useCategoryProducts } from "@/hooks/use-category-queries";

interface CategoryPageProps {
  params: {
    id: string;
  };
}

export default function CategoryDetailPage({ params }: CategoryPageProps) {
  const router = useRouter();
  const categoryId = params.id;
  
  // Fetch category details
  const { 
    data: category, 
    isLoading: categoryLoading, 
    error: categoryError 
  } = useCategory(categoryId);
  
  // Fetch category products
  const { 
    data: productsData, 
    isLoading: productsLoading, 
    error: productsError 
  } = useCategoryProducts(categoryId, { perPage: 50 });
  
  // If there's an error fetching the category, redirect to the categories page
  useEffect(() => {
    if (categoryError && !categoryLoading) {
      router.push('/categories');
    }
  }, [categoryError, categoryLoading, router]);
  
  const isLoading = categoryLoading || productsLoading;
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          <Skeleton className="w-full h-64 md:h-96 rounded-xl mb-12" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="h-48 bg-gray-50 flex items-center justify-center">
                <Skeleton className="h-32 w-32" />
              </div>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-full mb-1" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (categoryError || productsError) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12 bg-red-50 rounded-lg">
          <h3 className="text-xl font-medium text-red-700 mb-4">Error loading category data</h3>
          <p className="text-red-600 mb-8">We encountered an issue while loading the category information. Please try again later.</p>
          <Link href="/categories">
            <Button className="bg-gray-900 hover:bg-blue-600 text-white">
              Return to Categories
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  if (!category) {
    return null; // This shouldn't happen normally because we're redirecting on error
  }
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">{category.name} Tires</h1>
            {category.description && (
              <p className="text-gray-600 mt-2 max-w-3xl">
                {category.description}
              </p>
            )}
          </div>
          <Link href="/categories">
            <Button variant="outline" className="shrink-0">
              All Categories
            </Button>
          </Link>
        </div>
        
        {category.imageUrl && (
          <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden mb-12">
            <Image
              src={category.imageUrl}
              alt={category.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        )}
      </div>
      
      {productsData?.products && productsData.products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {productsData.products.map((product) => (
            <Card key={product.id} className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-200 hover:border-blue-100 group">
              <div className="h-48 bg-gray-50 relative flex items-center justify-center p-4">
                {product.images && product.images.length > 0 ? (
                  <Image 
                    src={product.images[0]} 
                    alt={product.name}
                    width={180}
                    height={180}
                    className="object-contain h-full w-auto transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full bg-gray-100">
                    <p className="text-gray-400">No image</p>
                  </div>
                )}
                
                {product.discount > 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs font-bold rounded">
                    {Math.round(product.discount)}% OFF
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-center mb-2">
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                    {product.width}/{product.aspectRatio}R{product.rimDiameter}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-1 truncate text-gray-900">{product.name}</h3>
                {product.brand && product.model && (
                  <p className="text-gray-500 text-sm mb-2">{product.brand.name} {product.model.name}</p>
                )}
                <div className="flex justify-between items-center mt-4">
                  <div className="flex flex-col">
                    {product.salePrice ? (
                      <>
                        <span className="text-lg font-bold text-blue-700">${product.salePrice.toFixed(2)}</span>
                        <span className="text-gray-400 text-sm line-through">${product.retailPrice.toFixed(2)}</span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-blue-700">${product.retailPrice.toFixed(2)}</span>
                    )}
                  </div>
                  <Link href={`/products/${product.id}`}>
                    <Button size="sm" className="bg-gray-900 hover:bg-blue-600 text-white">View Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-2xl font-medium text-gray-700 mb-4">No products found in this category</h3>
          <p className="text-gray-500 mb-8">We're working on adding products to this category. Please check back soon.</p>
          <Link href="/products">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">Browse All Products</Button>
          </Link>
        </div>
      )}
    </div>
  );
}