"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBrands } from "@/hooks/use-brand-queries";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export default function BrandsPage() {
  const { data, isLoading, error } = useBrands();
  const t = useTranslations("brandsPage");
  const params = useParams();
  const locale = params.locale as string;
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">{t("title")}</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">{t("description")}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="h-full overflow-hidden">
              <CardContent className="p-6 flex flex-col items-center">
                <Skeleton className="h-32 w-32 rounded-full mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-5/6 mb-4" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-red-50 rounded-lg">
          <h3 className="text-xl font-medium text-red-700 mb-4">{t("error.title")}</h3>
          <p className="text-red-600 mb-4">{t("error.description")}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {t("error.retry")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {data?.brands?.map((brand) => (
            <Link 
              key={brand.id} 
              href={`/${locale}/brands/${brand.id}`}
              className="group"
            >
              <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-200 hover:border-blue-100">
                <CardContent className="p-6 flex flex-col items-center">
                  <div className="h-32 w-full relative flex items-center justify-center mb-4">
                    {brand.logoUrl ? (
                      <Image 
                        src={brand.logoUrl} 
                        alt={brand.name}
                        width={120}
                        height={120}
                        className="object-contain max-h-full transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-4xl font-bold text-gray-400">{brand.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-center text-gray-900 mb-2">{brand.name}</h2>
                  {brand.description && (
                    <p className="text-gray-600 text-sm text-center line-clamp-2 mb-4">{brand.description}</p>
                  )}
                  {brand.productCount !== undefined && (
                    <p className="text-sm text-gray-500 mb-4">
                      {t("products", { count: brand.productCount })}
                    </p>
                  )}
                  <Button 
                    className="mt-auto bg-gray-900 hover:bg-blue-600 text-white w-full"
                    size="sm"
                  >
                    {t("viewProducts")}
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}