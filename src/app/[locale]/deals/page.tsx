"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ShoppingCartIcon, InfoIcon, ClipboardIcon } from "lucide-react";
import { 
  useActivePromotions, 
  formatPromotionValue, 
  getBadgeVariant, 
  isEndingSoon 
} from "@/hooks/use-promotions";
import { PromoCodeButton } from "@/components/promo-code-button";

export default function DealsPage() {
  const t = useTranslations("Deals");
  const { data, isLoading, error } = useActivePromotions();
  const promotions = data?.promotions || [];
  console.log("Promotions data:", promotions); // Debugging line
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="space-y-8">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">{t('title')}</h1>
          <p className="text-muted-foreground text-lg">
            {t('description')}
          </p>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                <Skeleton className="h-52 w-full" />
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-red-50 rounded-lg">
            <h3 className="text-2xl font-medium text-red-600">{t('errorLoading')}</h3>
            <p className="text-muted-foreground mt-3">{t('tryAgainLater')}</p>
            <Button variant="outline" className="mt-4">
              Refresh
            </Button>
          </div>
        ) : promotions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
            {promotions.map((promotion) => (
              <Card 
                key={promotion.id} 
                className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="relative">
                  {promotion.imageUrl && (
                    <div className="relative h-56 w-full">
                      <Image
                        src={promotion.imageUrl}
                        alt={promotion.title}
                        fill
                        className="object-cover"
                      />
                      <div 
                        className="absolute inset-0 opacity-20" 
                        style={{ backgroundColor: promotion.colorScheme }}
                      />
                    </div>
                  )}
                  
                  <Badge 
                    className={`${getBadgeVariant(promotion.colorScheme)} absolute top-4 right-4 text-sm font-medium px-3 py-1 shadow-md`}
                  >
                    {formatPromotionValue(promotion.type, promotion.value)}
                  </Badge>
                </div>
                
                <CardContent className="p-6 space-y-4 relative">
                  <div className="space-y-2">
                    <h3 className="font-bold text-2xl">{promotion.title}</h3>
                    <p className="text-muted-foreground">{promotion.description}</p>
                  </div>
                  
                  {/* Display promo code if available */}
                  {(promotion.promoCode || promotion.code) && (
                    <div className="bg-gray-50 rounded-md p-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <ClipboardIcon className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="font-medium">{t('promoCode')}</span>
                      </div>
                      <PromoCodeButton code={promotion.promoCode || promotion.code || ''} />
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-muted-foreground p-2 bg-gray-50 rounded-md">
                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                    <div>
                      {promotion.startDate && promotion.endDate ? (
                        <span>
                          {t('validPeriod', { 
                            startDate: format(new Date(promotion.startDate), 'PPP'),
                            endDate: format(new Date(promotion.endDate), 'PPP')
                          })}
                        </span>
                      ) : promotion.endDate ? (
                        <span>
                          {t('validUntil', { date: format(new Date(promotion.endDate), 'PPP') })}
                        </span>
                      ) : (
                        <span>{t('permanentOffer')}</span>
                      )}
                      
                      {isEndingSoon(promotion.endDate) && (
                        <Badge variant="outline" className="ml-2 text-red-500 border-red-500 font-medium">
                          {t('endingSoon')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="p-6 pt-0 grid grid-cols-2 gap-3">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/deals/${promotion.id}`}>
                      <InfoIcon className="mr-2 h-4 w-4" />
                      {t('viewDetails')}
                    </Link>
                  </Button>
                  <Button className="w-full" 
                    style={{ 
                      backgroundColor: promotion.colorScheme || 'hsl(var(--primary))' 
                    }} 
                    asChild
                  >
                    <Link href={promotion.howToRedeem ? `/deals/${promotion.id}#how-to-redeem` : "/products"}>
                      {promotion.howToRedeem ? (
                        <>
                          <InfoIcon className="mr-2 h-4 w-4" />
                          {t('howToRedeem')}
                        </>
                      ) : (
                        <>
                          <ShoppingCartIcon className="mr-2 h-4 w-4" />
                          {t('shopNow')}
                        </>
                      )}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-lg">
            <h3 className="text-2xl font-medium">{t('noPromotionsAvailable')}</h3>
            <p className="text-muted-foreground mt-3">{t('checkBackLater')}</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/products">
                <ShoppingCartIcon className="mr-2 h-4 w-4" />
                {t('browseProducts')}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}