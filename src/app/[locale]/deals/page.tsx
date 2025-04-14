"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CalendarIcon, TagIcon } from "lucide-react";
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
  return (
    <>
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            {t('description')}
          </p>
        </div>
          {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
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
          <div className="text-center py-16">
            <h3 className="text-xl font-medium text-red-600">{t('errorLoading')}</h3>
            <p className="text-muted-foreground mt-2">{t('tryAgainLater')}</p>
          </div>
        ) : promotions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {promotions.map((promotion) => (
              <Card key={promotion.id} className="overflow-hidden border-2" style={{ borderColor: promotion.colorScheme }}>
                {promotion.imageUrl && (
                  <div className="relative h-48 w-full">
                    <Image
                      src={promotion.imageUrl}
                      alt={promotion.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-xl">{promotion.title}</h3>
                    <Badge className={getBadgeVariant(promotion.colorScheme)}>
                      {formatPromotionValue(promotion.type, promotion.value)}
                    </Badge>
                  </div>
                    <p className="text-muted-foreground">{promotion.description}</p>
                  
                  {/* Display promo code if available */}
                  {(promotion.promoCode || promotion.code) && (
                    <div className="mb-2">
                      <PromoCodeButton code={promotion.promoCode || promotion.code || ''} />
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {promotion.startDate && promotion.endDate ? (
                      <span>
                        {t('validPeriod', { 
                          startDate: format(new Date(promotion.startDate), 'PPP'),
                          endDate: format(new Date(promotion.endDate), 'PPP')
                        })}
                        {isEndingSoon(promotion.endDate) && (
                          <Badge variant="outline" className="ml-2 text-red-500 border-red-500">
                            {t('endingSoon')}
                          </Badge>
                        )}
                      </span>
                    ) : promotion.endDate ? (
                      <span>
                        {t('validUntil', { date: format(new Date(promotion.endDate), 'PPP') })}
                        {isEndingSoon(promotion.endDate) && (
                          <Badge variant="outline" className="ml-2 text-red-500 border-red-500">
                            {t('endingSoon')}
                          </Badge>
                        )}
                      </span>
                    ) : (
                      <span>{t('permanentOffer')}</span>
                    )}
                  </div>                    <div className="flex space-x-2">
                    <Button className="flex-1" asChild>
                      <Link href={`/deals/${promotion.id}`}>
                        <TagIcon className="mr-2 h-4 w-4" />
                        {t('viewDetails')}
                      </Link>
                    </Button>
                    <Button className="flex-1" asChild>
                      <Link href={promotion.howToRedeem ? `/deals/${promotion.id}#how-to-redeem` : "/products"}>
                        <TagIcon className="mr-2 h-4 w-4" />
                        {promotion.howToRedeem ? t('howToRedeem') : t('shopNow')}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-medium">{t('noPromotionsAvailable')}</h3>
            <p className="text-muted-foreground mt-2">{t('checkBackLater')}</p>
          </div>
        )}
      </div>
    </>
  );
}
