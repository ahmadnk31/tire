import { Suspense } from "react";
import { Metadata } from "next";
import { ProductFilters } from "./components/product-filters";
import { ProductGrid } from "./components/product-grid";
import { ProductsHeader } from "./components/products-header";

export const metadata: Metadata = {
  title: "Browse Tires | Premium Tire Shop",
  description: "Browse our collection of premium tires for every vehicle type and driving condition.",
};

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <ProductsHeader />
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <div className="w-full lg:w-1/4">
          <ProductFilters />
        </div>
        
        {/* Products grid */}
        <div className="w-full lg:w-3/4">
          <Suspense fallback={<ProductsLoadingSkeleton />}>
            <ProductGrid />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function ProductsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="border rounded-lg overflow-hidden">
          <div className="h-48 bg-gray-200 animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-6 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
            <div className="mt-4 h-10 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}