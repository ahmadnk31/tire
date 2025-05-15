import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";

interface BrandPageProps {
  params: {
    id: string;
    locale: string;
  };
}

export async function generateMetadata({ params }: BrandPageProps) {
  const { id, locale } = await params;
  const t = await getTranslations("brandPage");
  
  const brand = await prisma.brand.findUnique({
    where: { id },
    include: {
      products: true
    }
  });
  
  if (!brand) {
    return {
      title: "Brand Not Found",
      description: "The requested brand could not be found",
    };
  }
  
  return {
    title: t("title", { brandName: brand.name }),
    description: brand.description || t("metaDescription", { brandName: brand.name }),
  };
}

async function getBrandWithProductsAndModels(brandId: string) {
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: {
      models: {
        orderBy: {
          name: 'asc',
        },
      },
      products: {
        where: {
          isVisible: true,
        },
        include: {
          model: true,
          category: true,
        },
        orderBy: [
          { isFeatured: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 50,
      },
    },
  });
  
  // Parse localized content if stored as strings
  if (brand && brand.products) {
    brand.products = brand.products.map(product => {
      const parsedProduct = { ...product };
      
      if (product?.localized_descriptions && typeof product.localized_descriptions === 'string') {
        parsedProduct.localized_descriptions = JSON.parse(product.localized_descriptions as string);
      }
      
      if (product?.localized_short_descriptions && typeof product.localized_short_descriptions === 'string') {
        parsedProduct.localized_short_descriptions = JSON.parse(product.localized_short_descriptions as string);
      }
      
      return parsedProduct;
    });
  }
  
  return brand;
}

// Helper function to get localized content
function getLocalizedContent(content: Record<string, string> | null, defaultContent: string | null, locale: string): string | null {
  if (!content) return defaultContent;
  
  // Try to get content in the requested locale
  if (content[locale]) return content[locale];
  
  // Fall back to English if available
  if (content['en']) return content['en'];
  
  // Otherwise return the first available translation
  const firstKey = Object.keys(content)[0];
  if (firstKey) return content[firstKey];
  
  // If all else fails, return the default content
  return defaultContent;
}

export default async function BrandDetailPage({ params }: BrandPageProps) {
  const { id, locale } = await params;
  const t = await getTranslations("brandPage");
  const brand = await getBrandWithProductsAndModels(id);
  
  if (!brand) {
    notFound();
  }
  
  // Group products by model
  const productsByModel = brand.models.map(model => {
    const modelProducts = brand.products.filter(product => product.modelId === model.id);
    return {
      model,
      products: modelProducts
    };
  }).filter(group => group.products.length > 0);
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            {brand.logoUrl && (
              <div className="w-20 h-20 relative flex-shrink-0">
                <Image
                  src={brand.logoUrl}
                  alt={brand.name}
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>
            )}
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                {t("heading", { brandName: brand.name })}
              </h1>
              {brand.description && (
                <p className="text-gray-600 mt-2 max-w-3xl">
                  {brand.description}
                </p>
              )}
            </div>
          </div>
          <Link href={`/${locale}/brands`}>
            <Button variant="outline" className="shrink-0">
              {t("breadcrumb")}
            </Button>
          </Link>
        </div>
      </div>
      
      {brand.models.length > 0 ? (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-8 flex flex-wrap h-auto">
            <TabsTrigger value="all" className="mb-2">{t("tabs.all")}</TabsTrigger>
            {brand.models.map(model => (
              <TabsTrigger key={model.id} value={model.id} className="mb-2">
                {model.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all">
            {brand.products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {brand.products.map((product) => (
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
                          <p className="text-gray-400">{t("product.noImage")}</p>
                        </div>
                      )}
                      
                      {product.discount > 0 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs font-bold rounded">
                          {t("product.discount", { discount: Math.round(product.discount) })}
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center mb-2">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                          {product.width}/{product.aspectRatio}R{product.rimDiameter}
                        </span>
                        <span className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded-full ml-2">
                          {product.category.name}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold mb-1 truncate text-gray-900">{product.name}</h3>
                      <p className="text-gray-500 text-sm mb-2">{product.model.name}</p>
                      
                      {/* Display localized short description if available */}
                      {(() => {
                        const localizedShortDescription = getLocalizedContent(
                          product.localized_short_descriptions as Record<string, string> | null,
                          product.short_description as string | null,
                          locale
                        );
                        
                        return localizedShortDescription ? (
                          <p className="text-gray-600 text-sm line-clamp-2 mb-2">{localizedShortDescription}</p>
                        ) : null;
                      })()}
                      
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
                        <Link href={`/${locale}/products/${product.id}`}>
                          <Button size="sm" className="bg-gray-900 hover:bg-blue-600 text-white">
                            {t("product.viewDetails")}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-2xl font-medium text-gray-700 mb-4">{t("emptyState.title")}</h3>
                <p className="text-gray-500 mb-8">{t("emptyState.description")}</p>
                <Link href={`/${locale}/products`}>
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                    {t("emptyState.browseAll")}
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
          
          {brand.models.map(model => (
            <TabsContent key={model.id} value={model.id}>
              {(productsByModel.find(group => group.model.id === model.id)?.products?.length ?? 0) > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {productsByModel.find(group => group.model.id === model.id)?.products.map((product) => (
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
                            <p className="text-gray-400">{t("product.noImage")}</p>
                          </div>
                        )}
                        
                        {product.discount > 0 && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs font-bold rounded">
                            {t("product.discount", { discount: Math.round(product.discount) })}
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center mb-2">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                            {product.width}/{product.aspectRatio}R{product.rimDiameter}
                          </span>
                          <span className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded-full ml-2">
                            {product.category.name}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold mb-1 truncate text-gray-900">{product.name}</h3>
                        
                        {/* Display localized short description if available */}
                        {(() => {
                          const localizedShortDescription = getLocalizedContent(
                            product.localized_short_descriptions as Record<string, string> | null,
                            product.short_description as string | null,
                            locale
                          );
                          
                          return localizedShortDescription ? (
                            <p className="text-gray-600 text-sm line-clamp-2 mb-2">{localizedShortDescription}</p>
                          ) : null;
                        })()}
                        
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
                          <Link href={`/${locale}/products/${product.id}`}>
                            <Button size="sm" className="bg-gray-900 hover:bg-blue-600 text-white">
                              {t("product.viewDetails")}
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-2xl font-medium text-gray-700 mb-4">{t("emptyState.emptyModelTitle")}</h3>
                  <p className="text-gray-500 mb-8">{t("emptyState.emptyModelDescription")}</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-2xl font-medium text-gray-700 mb-4">{t("emptyState.title")}</h3>
          <p className="text-gray-500 mb-8">{t("emptyState.description")}</p>
          <Link href={`/${locale}/products`}>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              {t("emptyState.browseAll")}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}