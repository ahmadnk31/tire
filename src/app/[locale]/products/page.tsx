import { Suspense } from "react";
import { ProductFilters } from "./components/product-filters";
import { ProductGrid } from "./components/product-grid";
import { ProductsHeader } from "./components/products-header";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations("Products");
  
  return {
    title: `${t("title")} | Premium Tire Shop`,
    description: t("description"),
  };
}

export default async function ProductsPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations("Products");
  
  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <ProductsHeader />
      
      {/* Mobile filters toggle (visible only on small screens) */}
      <div className="block lg:hidden mb-4">
        <details className="overflow-hidden rounded-lg border mb-4">
          <summary className="flex cursor-pointer items-center justify-between bg-gray-50 px-5 py-3 transition">
            <span className="text-sm font-medium">
              {t("filters.title")}
            </span>
            <span className="shrink-0 transition duration-300 group-open:-rotate-180">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          </summary>

          <div className="border-t px-5 py-4 display-none lg:block">
            <ProductFilters />
          </div>
        </details>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Sidebar filters - only visible on desktop */}
        <div className="hidden lg:block w-full lg:w-1/4 lg:sticky lg:top-8 lg:self-start">
          <div className="bg-white rounded-lg shadow-sm border p-5">
            <h2 className="font-medium text-lg mb-4">{t("filters.title")}</h2>
            <ProductFilters />
          </div>
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