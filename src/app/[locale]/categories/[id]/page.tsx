import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";

interface CategoryPageProps {
  params: {
    id: string;
    locale: string;
  };
}

// Generate metadata for the page
export async function generateMetadata({ params }: CategoryPageProps) {
  const { id, locale } = await params;
  const t = await getTranslations('Category');
  
  try {
    const category = await prisma.category.findUnique({
      where: { id }
    });
    
    if (!category) {
      return {
        title: t('categoryNotFoundTitle'),
        description: t('categoryNotFoundDesc'),
      };
    }
    
    return {
      title: t('categoryMetaTitle', { name: category.name }),
      description: category.description || t('categoryDefaultDesc', { name: category.name }),
    };
  } catch (error) {
    return {
      title: t('categoryErrorTitle'),
      description: t('categoryErrorDesc'),
    };
  }
}

// Server-side data fetching function
async function getCategoryWithProducts(categoryId: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    
    if (!category) return null;
    
    const products = await prisma.product.findMany({
      where: { 
        categoryId,
        isVisible: true,
      },
      include: {
        brand: true,
        model: true,
      },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });
    
    // Parse any string-encoded JSON fields
    const parsedProducts = products.map(product => {
      const parsedProduct = { ...product };
      
      if (product?.localized_descriptions && typeof product.localized_descriptions === 'string') {
        parsedProduct.localized_descriptions = JSON.parse(product.localized_descriptions as string);
      }
      
      if (product?.localized_short_descriptions && typeof product.localized_short_descriptions === 'string') {
        parsedProduct.localized_short_descriptions = JSON.parse(product.localized_short_descriptions as string);
      }
      
      return parsedProduct;
    });
    
    return { category, products: parsedProducts };
  } catch (error) {
    console.error("Error fetching category data:", error);
    return null;
  }
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

export default async function CategoryDetailPage({ params }: CategoryPageProps) {
  const { id: categoryId, locale } = await params;
  const t = await getTranslations('Category');
  
  // Fetch category and products directly on the server
  const data = await getCategoryWithProducts(categoryId);
  
  if (!data) {
    notFound();
  }
  
  const { category, products } = data;
    // Since we're using server components, we don't need loading states anymore
  // If data wasn't found, the notFound() function would have already been called
    return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">{t('categoryTitle', {name: category.name})}</h1>
            {category.description && (
              <p className="text-gray-600 mt-2 max-w-3xl">
                {category.description}
              </p>
            )}
          </div>
          <Link href={`/${locale}/categories`}>
            <Button variant="outline" className="shrink-0">
              {t('allCategories')}
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
      
      {products && products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
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
                    <p className="text-gray-400">{t('noImage')}</p>
                  </div>
                )}
                
                {product.discount > 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs font-bold rounded">
                    {Math.round(product.discount)}% {t('off')}
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
                    <Button size="sm" className="bg-gray-900 hover:bg-blue-600 text-white">{t('viewDetails')}</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-2xl font-medium text-gray-700 mb-4">{t('noProductsFound')}</h3>
          <p className="text-gray-500 mb-8">{t('noProductsFoundMessage')}</p>
          <Link href={`/${locale}/products`}>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">{t('browseAllProducts')}</Button>
          </Link>
        </div>
      )}
    </div>
  );
}