"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/cart-context";
import { usePromotion } from "@/contexts/promotion-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingCart, 
  ArrowRight, 
  Info, 
  ImageIcon,
  Tag,
  X
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const router = useRouter();
  const { 
    items, 
    updateItemQuantity, 
    removeItem, 
    summary, 
    itemCount,
    applyPromoCode,
    appliedPromotions,
    removePromotion
  } = useCart();
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});
  const [promoCode, setPromoCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const t = useTranslations('cart')
  const tDeals = useTranslations('Deals')
  // Handle quantity change
  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setIsUpdating({ ...isUpdating, [id]: true });
    
    // Simulate a slight delay for better UX
    setTimeout(() => {
      updateItemQuantity(id, newQuantity);
      setIsUpdating({ ...isUpdating, [id]: false });
    }, 300);
  };
  // Handle item removal
  const handleRemoveItem = (id: string) => {
    setIsUpdating({ ...isUpdating, [id]: true });
    
    // Simulate a slight delay for better UX
    setTimeout(() => {
      removeItem(id);
    }, 300);
  };

  // Handle applying promotion code
  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) return;
    
    setIsApplying(true);
    const success = await applyPromoCode(promoCode.trim());
    
    if (success) {
      toast.success(tDeals("codeCopied"));
      setPromoCode("");
    } else {
      toast.error(t("invalidPromoCode"));
    }
    
    setIsApplying(false);
  };

  // Format price to display with 2 decimal places
  
  if (items.length === 0) {
    return (
      <div className="container max-w-4xl py-12 px-2 md:px-4 lg:px-8">
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">{t('empty')}</h1>
          <p className="text-muted-foreground mb-6">
            {t('emptyMessage')}
          </p>
          <Button asChild size="lg">
            <Link href="/products">{t('browseTires')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-12 px-2 md:px-4 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-shrink-0 w-full sm:w-32 h-32 bg-gray-100 rounded-md relative overflow-hidden">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 8rem"
                          style={{ objectFit: "contain" }}
                          className="p-2"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                          <ImageIcon className="h-12 w-12" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col">
                      <div>
                        <div className="flex justify-between">
                          <div>
                            <Link href={`/products/{item.productId}`}>
                              <h3 className="font-medium hover:text-primary transition-colors">
                                {item.name}
                              </h3>
                            </Link>
                            <p className="text-sm text-muted-foreground">{item.brandName}</p>
                          </div>
                          
                          <div className="text-right">
                            {item.originalPrice && item.price < item.originalPrice ? (
                              <div>
                                <span className="font-medium">{formatPrice(item.price)}</span>
                                <span className="text-sm text-muted-foreground line-through ml-2">
                                  {formatPrice(item.originalPrice)}
                                </span>
                              </div>
                            ) : (
                              <span className="font-medium">{formatPrice(item.price)}</span>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">
                              {formatPrice(item.price)} {t('eachUnit')}
                            </p>
                          </div>
                        </div>
                        
                        <Badge variant="outline" className="mt-1 mb-3">
                          {item.size}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 rounded-r-none"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={isUpdating[item.id] || item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                            className="h-8 w-12 rounded-none text-center px-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            disabled={isUpdating[item.id]}
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 rounded-l-none"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            disabled={isUpdating[item.id]}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isUpdating[item.id]}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {t('removeItem')}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <div className="w-full flex justify-between mt-4">
                <Button variant="outline" asChild>
                  <Link href="/products">
                    {t('continueShopping')}
                  </Link>
                </Button>
                <Button variant="default" onClick={() => router.push("/checkout")}>
                  {t('checkout')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">{t('orderSummary')}</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('subtotal')} ({itemCount} items)</span>
                  <span>{formatPrice(summary.subtotal)}</span>
                </div>
                
                {summary.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{t('savings',{amount:formatPrice(summary.discount)})}</span>
                    <span>-{formatPrice(summary.discount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <span className="text-muted-foreground">{t('estimatedTax')}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {t('taxTooltip')}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span>{formatPrice(summary.tax)}</span>
                </div>
                
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <span className="text-muted-foreground">{t('shipping')}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {t('shippingTooltip')}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span>{t('calculatedAtCheckout')}</span>
                </div>
              </div>
                {/* Promotion Code Input */}
              <div className="mt-6">
                <h3 className="font-medium mb-2">{tDeals("promoCode")}</h3>
                <div className="flex space-x-2">
                  <Input
                    placeholder={t("enterPromoCode")}
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    disabled={isApplying}
                  />
                  <Button 
                    onClick={handleApplyPromoCode} 
                    disabled={!promoCode.trim() || isApplying}
                    size="sm"
                  >
                    {isApplying ? t("applying") : t("apply")}
                  </Button>
                </div>
                
                {/* Applied Promotions */}
                {appliedPromotions.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <h3 className="font-medium text-sm">{t("appliedPromotions")}</h3>
                    {appliedPromotions.map(promo => (
                      <div key={promo.id} className="flex items-center justify-between bg-primary/5 p-2 rounded-md">
                        <div className="flex items-center space-x-2">
                          <Tag className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{promo.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {promo.type === 'percentage' ? `${promo.value}% ${t("discount")}` : 
                               promo.type === 'fixed' ? `${formatPrice(promo.value)} ${t("off")}` : 
                               promo.type === 'free_shipping' ? t("freeShipping") : t("specialOffer")}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full"
                          onClick={() => removePromotion(promo.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {summary.promotionsDiscount > 0 && (
                  <div className="flex justify-between mt-4 text-green-600">
                    <span>{t("promoDiscount")}</span>
                    <span>-{formatPrice(summary.promotionsDiscount)}</span>
                  </div>
                )}
              </div>

              <Separator className="my-4" />
              
              <div className="flex justify-between text-lg font-semibold">
                <span>{t('estimatedTotal')}</span>
                <span>{formatPrice(summary.total)}</span>
              </div>
              
              <Button
                className="w-full mt-6" 
                size="lg"
                onClick={() => router.push("/checkout")}
              >
                {t('proceedToCheckout')}
              </Button>
              
              <div className="mt-6 text-sm text-muted-foreground">
                <p className="mb-2">{t('weAccept')}</p>
                <div className="flex gap-2">
                  <Image 
                    src="/visa.svg" 
                    alt="Visa" 
                    width={32} 
                    height={20} 
                    className="h-6 w-auto" 
                  />
                  <Image 
                    src="/mastercard.svg" 
                    alt="Mastercard" 
                    width={32} 
                    height={20} 
                    className="h-6 w-auto" 
                  />
                  <Image 
                    src="/amex.svg" 
                    alt="American Express" 
                    width={32} 
                    height={20} 
                    className="h-6 w-auto" 
                  />
                  <Image 
                    src="/paypal.svg" 
                    alt="PayPal" 
                    width={32} 
                    height={20} 
                    className="h-6 w-auto" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}