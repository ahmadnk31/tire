"use client";

import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface ProductPriceDisplayProps {
  retailPrice: number;
  wholesalePrice: number;
  discount: number;
  retailerDiscount: number;
  salePrice: number | null;
  wholesaleSalePrice: number | null;
  className?: string;
}

export function ProductPriceDisplay({
  retailPrice,
  wholesalePrice,
  discount,
  retailerDiscount,
  salePrice,
  wholesaleSalePrice,
  className,
}: ProductPriceDisplayProps) {
  const { data: session } = useSession();
  const t = useTranslations("ProductDetail");
  const userRole = session?.user?.role;

  // Determine if user is a retailer
  const isRetailer = userRole === "RETAILER";

  // Select the appropriate price based on user role
  const basePrice = isRetailer ? wholesalePrice : retailPrice;
  const discountPercentage = isRetailer ? retailerDiscount : discount;
  const discountedPrice = isRetailer ? wholesaleSalePrice : salePrice;

  // Calculate if there is a discount to apply
  const hasDiscount = isRetailer ? retailerDiscount > 0 : discount > 0;

  // Calculate the final price with discount if applicable
  const finalPrice = hasDiscount
    ? discountedPrice !== null
      ? discountedPrice
      : basePrice - (basePrice * discountPercentage) / 100
    : basePrice;

  return (
    <div className={cn("mb-4", className)}>
      <div className='flex flex-wrap items-center gap-2 mb-1'>
        {isRetailer && (
          <Badge
            variant='secondary'
            className='text-xs sm:text-sm font-medium bg-blue-100'
          >
            {t("pricing.wholesale")}
          </Badge>
        )}
        {hasDiscount && (
          <Badge
            variant='destructive'
            className='text-xs sm:text-sm font-medium'
          >
            {t("pricing.discount", { percent: discountPercentage })}
          </Badge>
        )}
      </div>

      <div className='flex items-center gap-2'>
        <span className='text-2xl sm:text-3xl font-bold'>
          {formatPrice(finalPrice)}
        </span>

        {hasDiscount && (
          <span className='text-base sm:text-xl text-gray-500 line-through'>
            {formatPrice(basePrice)}
          </span>
        )}
      </div>

      {isRetailer && (
        <p className='text-xs sm:text-sm text-muted-foreground mt-1'>
          {t("pricing.wholesalePricing")}
        </p>
      )}
    </div>
  );
}
