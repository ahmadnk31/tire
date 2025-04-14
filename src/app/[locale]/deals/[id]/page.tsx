import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon, ShoppingBag, Tag, Info, Gift, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { 
  getBadgeVariant, 
  formatPromotionValue 
} from "@/lib/api/promotion";

import { PromoCodeButton } from "@/components/promo-code-button";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

export default async function PromotionDetailPage({ params, searchParams }: { 
  params: { id: string, locale: string }, 
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const t = await getTranslations('Deals');
  const tProduct = await getTranslations('Products.product');
  const {id: promotionId} = params;
  
  // Pagination parameters
  const page = Number(searchParams?.page || 1);
  const pageSize = 3; // Number of products per page
  
  const promotion = await prisma.promotion.findUnique({
    where: { id: promotionId },
    include: {
      products: true,
      brands: true,
      categories: true
    }
  });

  if (!promotion) {
    notFound();
  }

  // Get total count for pagination
  const totalRelatedProducts = await prisma.product.count({
    where: {
      promotionId: promotionId,
      OR: [
        { brandId: { in: promotion.brands.map(brand => brand.id) } },
        { categoryId: { in: promotion.categories.map(category => category.id) } }
      ]
    }
  });
  
  const totalPages = Math.ceil(totalRelatedProducts / pageSize);

  // Get paginated products
  const relatedProducts = await prisma.product.findMany({
    where: {
      promotionId: promotionId,
      OR: [
        { brandId: { in: promotion.brands.map(brand => brand.id) } },
        { categoryId: { in: promotion.categories.map(category => category.id) } }
      ]
    },
    select: {
      id: true,
      name: true,
      salePrice: true,
      retailPrice: true,
      discount: true,
      images: true,
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { name: 'asc' }
  }) || [];

  const formatDate = (date: string | number | Date) => {
    return date ? format(new Date(date), 'PPP') : '';
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <Button 
        variant="outline"
        size="sm"
        asChild
        className="mb-6 hover:bg-secondary/80 transition-colors"
      >
        <Link href="/deals" className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('detail.back')}
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="overflow-hidden border-0 shadow-md">
            <CardHeader className="pb-0 pt-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <CardTitle className="text-3xl font-bold">{promotion.title}</CardTitle>
                <Badge className={`${getBadgeVariant(promotion.colorScheme)} text-sm px-3 py-1`}>
                  {formatPromotionValue(promotion.type, promotion.value)}
                </Badge>
              </div>
              
              <div className="flex items-center text-sm text-muted-foreground mt-3">
                <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                {promotion.startDate && promotion.endDate ? (
                  <span>
                    {t('detail.validPeriod', { 
                      startDate: formatDate(promotion.startDate),
                      endDate: formatDate(promotion.endDate)
                    })}
                  </span>
                ) : (
                  <span>{t('detail.permanentOffer')}</span>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {promotion.imageUrl && (
                <div className="relative h-80 w-full rounded-lg overflow-hidden mb-6">
                  <Image
                    src={promotion.imageUrl}
                    alt={promotion.title}
                    fill
                    className="object-cover transition-transform hover:scale-105 duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority
                  />
                </div>
              )}

              <div className="prose max-w-none">
                <p className="text-lg leading-relaxed">{promotion.description}</p>
              </div>
            </CardContent>
          </Card>

          {(promotion.termsAndConditions || promotion.howToRedeem) && (
            <Card className="border-0 shadow-md">
              <CardContent className="p-0">
                {promotion.howToRedeem && (
                  <div className="p-6 border-b">
                    <div className="flex items-center mb-4">
                      <Gift className="h-5 w-5 mr-2 text-primary" />
                      <h2 className="text-xl font-semibold">{t('detail.howToRedeem')}</h2>
                    </div>
                    <div className="prose max-w-none pl-7">
                      {promotion.howToRedeem}
                    </div>
                  </div>
                )}

                {promotion.termsAndConditions && (
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <Info className="h-5 w-5 mr-2 text-primary" />
                      <h2 className="text-xl font-semibold">{t('detail.termsAndConditions')}</h2>
                    </div>
                    <div className="prose max-w-none pl-7">
                      {promotion.termsAndConditions}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold flex items-center">
                <Tag className="h-5 w-5 mr-2 text-primary" />
                {t('detail.promotionDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-5">
              {promotion.promoCode && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">{t('detail.promoCode')}</h3>
                  <PromoCodeButton code={promotion.promoCode} />
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button className="w-full" size="lg" asChild>
                <Link href="/products" className="flex items-center justify-center">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  {t('shopNow')}
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold">
                  {t('detail.relatedProducts')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 gap-4">
                  {relatedProducts.length > 0 ? relatedProducts.map((product) => (
                    <Card key={product.id} className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex">
                        {product.images && product.images.length > 0 ? (
                          <div className="relative h-24 w-24 flex-shrink-0">
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="96px"
                            />
                          </div>
                        ) : (
                          <div className="h-24 w-24 bg-muted flex items-center justify-center flex-shrink-0">
                            <span className="text-sm text-muted-foreground">{tProduct('noImage')}</span>
                          </div>
                        )}
                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <h4 className="font-medium line-clamp-1 mb-1">{product.name}</h4>
                          <div className="flex items-center justify-between mt-auto">
                            <div className="flex flex-col">
                              <span className="font-medium text-primary">${(product.salePrice || 0).toFixed(2)}</span>
                              {product.discount > 0 && (
                                <span className="text-xs text-muted-foreground line-through">
                                  ${product.retailPrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                            <Button size="sm" variant="outline" asChild className="text-xs px-2 py-1 h-8">
                              <Link href={`/products/${product.id}`}>
                                {tProduct('viewDetails')}
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )) : (
                    <div className="py-8 text-center text-muted-foreground">
                      <p>{t('detail.noProductsOnPage')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex flex-col gap-4">
                {totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href={page > 1 ? `?page=${page - 1}` : '#'}
                          className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {/* Show ellipsis for many pages */}
                      {totalPages <= 7 ? (
                        // Show all page numbers if 7 or fewer
                        Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                          <PaginationItem key={pageNum}>
                            <PaginationLink 
                              href={`?page=${pageNum}`}
                              isActive={page === pageNum}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        ))
                      ) : (
                        // Complex pagination with ellipsis
                        <>
                          {/* First page */}
                          <PaginationItem>
                            <PaginationLink href="?page=1" isActive={page === 1}>
                              1
                            </PaginationLink>
                          </PaginationItem>
                          
                          {/* Left ellipsis */}
                          {page > 3 && (
                            <PaginationItem>
                              <span className="flex h-9 w-9 items-center justify-center text-sm">
                                ...
                              </span>
                            </PaginationItem>
                          )}
                          
                          {/* Current page and neighbors */}
                          {Array.from(
                            { length: 3 }, 
                            (_, i) => page - 1 + i
                          )
                            .filter(p => p > 1 && p < totalPages)
                            .map(pageNum => (
                              <PaginationItem key={pageNum}>
                                <PaginationLink 
                                  href={`?page=${pageNum}`}
                                  isActive={page === pageNum}
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            ))
                          }
                          
                          {/* Right ellipsis */}
                          {page < totalPages - 2 && (
                            <PaginationItem>
                              <span className="flex h-9 w-9 items-center justify-center text-sm">
                                ...
                              </span>
                            </PaginationItem>
                          )}
                          
                          {/* Last page */}
                          <PaginationItem>
                            <PaginationLink 
                              href={`?page=${totalPages}`}
                              isActive={page === totalPages}
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext 
                          href={page < totalPages ? `?page=${page + 1}` : '#'}
                          className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
                
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/products">
                    {t('viewAllProducts')}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}