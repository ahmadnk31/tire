"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/use-category-queries";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoriesPage() {
  const { data, isLoading, error } = useCategories();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">Tire Categories</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Browse our comprehensive selection of tire categories to find the perfect match for your vehicle and driving needs.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="relative overflow-hidden rounded-xl h-64">
              <Skeleton className="absolute inset-0" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-red-50 rounded-lg">
          <h3 className="text-xl font-medium text-red-700 mb-4">Error loading categories</h3>
          <p className="text-red-600 mb-4">We encountered an issue while loading the categories. Please try again later.</p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Retry
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data?.categories?.map((category) => (
            <Link 
              key={category.id} 
              href={`/categories/${category.id}`}
              className="relative overflow-hidden rounded-xl group h-64 shadow-md"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/70 z-10" />
              
              {category.imageUrl ? (
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-800 to-gray-900" />
              )}
              
              <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                <h2 className="text-xl font-bold text-white mb-2">{category.name}</h2>
                <p className="text-white/80 text-sm mb-3 line-clamp-2">
                  {category.description || `Shop our selection of ${category.name} tires`}
                </p>
                <span className="inline-flex items-center text-sm text-white group-hover:underline">
                  Browse Collection
                  <svg className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}