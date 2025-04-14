import { Suspense } from "react";

// Import product-related components
import { ProductCarousel } from "@/components/product/product-carousel";
import { FavoriteButton } from "@/components/product/favorite-button";
import { ProductActions } from "@/components/product/product-actions";
import { QuantitySection } from "@/components/product/quantity-section";

// Import review-related components
import { RatingDisplay } from "@/components/review/rating-display";
import { ReviewCard } from "@/components/review/review-card";
import { ReviewsList } from "@/components/review/reviews-list";
import { ReviewForm } from "@/components/review/review-form";
import { ClientReviewCardActions } from "@/components/review/client-review-card-actions";
import { Metadata } from "next";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Star, ShoppingCart, Heart, Trash2, Edit } from "lucide-react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ProductRecommendations } from "@/components/product/product-recommendations";
import { WriteReviewButton } from "@/components/review/write-review-button";
import { ProductPriceDisplay } from "@/components/product/product-price-display";

// Define interface for product data based on your Prisma schema
interface ProductData {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  brandId: string;
  brand: {
    name: string;
    logoUrl: string | null;
  };
  modelId: string;
  model: {
    name: string;
  };
  categoryId: string;
  category: {
    name: string;
  };
  width: number;
  aspectRatio: number;
  rimDiameter: number;
  loadIndex: number;
  speedRating: string;
  constructionType: string | null;
  treadDepth: number;
  sidewallType: string;
  tireType: string;
  runFlat: boolean;
  reinforced: boolean;
  treadPattern: string;
  wetGrip: string;
  fuelEfficiency: string;
  noiseLevel: string;
  snowRating: string;
  treadwear: number;
  traction: string;
  temperature: string;
  mileageWarranty: number | null;
  plyRating: number;
  maxInflationPressure: number | null;
  maxLoad: number | null;
  retailPrice: number;
  wholesalePrice: number;
  discount: number;
  retailerDiscount: number;
  salePrice: number | null;
  wholesaleSalePrice: number | null;
  stock: number;
  manufacturerPartNumber: string;
  certifications: string;
  countryOfOrigin: string;
  images: string[];
  isVisible: boolean;
  isFeatured: boolean;
  isDiscontinued: boolean;
  reviews: {
    id: string;
    rating: number;
    content: string;
    user: {
      id: string;
      name: string;
      image: string | null;
    };
    createdAt: Date;
    images?: {
      id: string;
      imageUrl: string;
      caption: string | null;
      createdAt: Date;
      reviewId: string;
    }[];
    _count: {
      likes: number;
      comments: number;
    };
  }[];  _count: {
    reviews: number;
    Favorite: number;
  };
}

// Generate metadata for the page
export async function generateMetadata({ params }: { params: { productId: string } }): Promise<Metadata> {
  const { productId } = await params;
  const product = await getProduct(productId);
  
  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const tireSize = `${product.width}/${product.aspectRatio}R${product.rimDiameter}`;
  
  return {
    title: `${product.name} - ${tireSize} | Premium Tire Shop`,
    description: product.description || `${product.brand.name} ${product.name} tire in size ${tireSize}`,
    openGraph: {
      images: product.images?.[0] ? [product.images[0]] : [],
    },
  };
}

// Fetch product data from database
async function getProduct(productId: string): Promise<ProductData | null> {  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        brand: true,
        model: true,
        category: true,
        
        reviews: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            images: true,
            likes: true,
            comments: true,
            _count: {
              select: {
                likes: true,
                comments: true,
                images: true,
              }
            }
          }
        },
        _count: {
          select: {
            reviews: true,
            Favorite: true
            
          }
        }
      }
    });

    return product;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

// Average rating calculation helper
function calculateAverageRating(reviews: ProductData['reviews']) {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return sum / reviews.length;
}

export default async function ProductPage({ params }: { params: { productId: string, locale: string } }) {
  const t = await getTranslations('ProductDetail');
  const {productId} = await params;
  const product = await getProduct(productId);
  
  if (!product) {
    notFound();
  }

  // Calculate the discounted price if there's a discount
  const hasDiscount = product.discount > 0;
  const finalPrice = hasDiscount
    ? product.salePrice !== null
      ? product.salePrice
      : product.retailPrice - (product.retailPrice * product.discount / 100)
    : product.retailPrice;

  // Format tire size (e.g., 225/65R17)
  const tireSize = `${product.width}/${product.aspectRatio}R${product.rimDiameter}`;

  // Format the specification string (e.g., 95H)
  const loadSpeedSpec = `${product.loadIndex}${product.speedRating}`;

  // Transform performance ratings
  const performanceLabels: Record<string, string> = {
    "A": "Excellent",
    "B": "Good",
    "C": "Fair",
    "D": "Poor",
    "E": "Very Poor"
  };

  // Stock status
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock === 0;
  
  // Average rating
  const averageRating = calculateAverageRating(product.reviews);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <div className="mb-6 text-sm">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1">
            <li className="inline-flex items-center">
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                {t('breadcrumb.home')}
              </Link>
              <span className="mx-2">/</span>
            </li>
            <li className="inline-flex items-center">
              <Link href="/products" className="text-gray-500 hover:text-gray-700">
                {t('breadcrumb.products')}
              </Link>
              <span className="mx-2">/</span>
            </li>
            <li className="inline-flex items-center">
              <Link href={`/brands/${product.brandId}`} className="text-gray-500 hover:text-gray-700">
                {product.brand.name}
              </Link>
              <span className="mx-2">/</span>
            </li>
            <li>
              <span className="text-gray-900">{product.name}</span>
            </li>
          </ol>
        </nav>
      </div>      <div className="flex flex-col lg:flex-row gap-8">
        {/* Product Images */}
        <div className="w-full lg:w-1/2">
          <div className="sticky top-20">
            <ProductCarousel 
              images={product.images}
              productName={product.name}
              alt={`${product.brand.name} ${product.name}`}
            />
          </div>
        </div>

        {/* Product Information */}
        <div className="w-full lg:w-1/2">          <div className="mb-2 flex items-center">
            <Link href={`/brands/${product.brandId}`} className="text-gray-500 hover:underline">
              {product.brand.name}
            </Link>
            {product.isFeatured && (
              <Badge variant="secondary" className="ml-2">
                {t('badge.featured')}
              </Badge>
            )}
          </div>

          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>

          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline">{tireSize}</Badge>
            <Badge variant="outline">{loadSpeedSpec}</Badge>
            <Badge>{product.tireType.replace('_', ' ')}</Badge>
            {product.runFlat && <Badge variant="secondary">{t('badge.runFlat')}</Badge>}
            {product.reinforced && <Badge variant="secondary">{t('badge.reinforced')}</Badge>}
            {product.snowRating && <Badge variant="outline">{product.snowRating}</Badge>}
          </div>

          {/* Reviews summary */}          
          <div className="flex items-center mb-4">
            <div className="flex">
              <RatingDisplay productId={product.id}  />
            </div>
            <span className="text-sm text-gray-500 ml-2">
              {product._count.reviews} {product._count.reviews === 1 ? t('reviews.review') : t('reviews.reviews')}
            </span>
          </div>          {/* Price information */}
          <div>
            <ProductPriceDisplay
              retailPrice={product.retailPrice}
              wholesalePrice={product.wholesalePrice}
              discount={product.discount}
              retailerDiscount={product.retailerDiscount}
              salePrice={product.salePrice}
              wholesaleSalePrice={product.wholesaleSalePrice}
            />

            {/* Stock information */}
            <div className="mt-2">
              {isOutOfStock ? (
                <span className="text-red-500 font-medium">{t('price.outOfStock')}</span>
              ) : isLowStock && product.stock <= 3 ? (
                <span className="text-amber-500 font-medium">{t('price.lowStock', { count: product.stock })}</span>
              ) : (
                <span className="text-green-500 font-medium">{t('price.inStock')}</span>
              )}
            </div>
          </div>{/* Performance ratings */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">{t('performance.title')}</h3>
            <div className="flex space-x-6">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-full mb-1">
                  <span className="text-blue-600 font-bold text-lg">{product.wetGrip}</span>
                </div>
                <span className="text-sm text-gray-500">{t('performance.wetGrip')}</span>
                <span className="text-xs">{t(`performance.ratings.${product.wetGrip}`) || product.wetGrip}</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-50 rounded-full mb-1">
                  <span className="text-green-600 font-bold text-lg">{product.fuelEfficiency}</span>
                </div>
                <span className="text-sm text-gray-500">{t('performance.fuelEfficiency')}</span>
                <span className="text-xs">{t(`performance.ratings.${product.fuelEfficiency}`) || product.fuelEfficiency}</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-50 rounded-full mb-1">
                  <span className="text-gray-600 font-bold text-lg">{product.noiseLevel}</span>
                </div>
                <span className="text-sm text-gray-500">{t('performance.noise')}</span>
              </div>
            </div>
          </div>{/* Action buttons */}
          {!isOutOfStock && (
            <div className="flex space-x-4 mb-6">
              <AddToCartButton
                product={product}
                quantity={product.stock}
              />
              <FavoriteButton productId={product.id} variant="default" size="default" />
            </div>
          )}

          {/* Short description */}
          {product.description && (
            <div className="mb-6 text-gray-700">
              <p>{product.description}</p>
            </div>
          )}

          {/* Detailed information in tabs */}
          <Tabs defaultValue="specifications" className="mt-6">
            <TabsList>              <TabsTrigger value="specifications">{t('tabs.specifications')}</TabsTrigger>
              <TabsTrigger value="performance">{t('tabs.performance')}</TabsTrigger>
              <TabsTrigger value="details">{t('tabs.details')}</TabsTrigger>
            </TabsList>
            <TabsContent value="specifications" className="pt-4">
              <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                <div>
                  <span className="font-medium">{t('specifications.size')}</span>
                  <p>{tireSize}</p>
                </div>
                <div>
                  <span className="font-medium">{t('specifications.loadSpeed')}</span>
                  <p>{loadSpeedSpec}</p>
                </div>
                <div>
                  <span className="font-medium">{t('specifications.type')}</span>
                  <p>{product.tireType.replace('_', ' ')}</p>
                </div>                <div>
                  <span className="font-medium">{t('specifications.construction')}</span>
                  <p>{product.constructionType || t('specifications.standard')}</p>
                </div>
                <div>
                  <span className="font-medium">{t('specifications.treadDepth')}</span>
                  <p>{product.treadDepth}mm</p>
                </div>
                <div>
                  <span className="font-medium">{t('specifications.sidewall')}</span>
                  <p>{product.sidewallType}</p>
                </div>
                <div>
                  <span className="font-medium">{t('specifications.runFlat')}</span>
                  <p>{product.runFlat ? t('specifications.yes') : t('specifications.no')}</p>
                </div>
                <div>
                  <span className="font-medium">{t('specifications.reinforced')}</span>
                  <p>{product.reinforced ? t('specifications.yes') : t('specifications.no')}</p>
                </div>
                <div>
                  <span className="font-medium">{t('specifications.plyRating')}</span>
                  <p>{product.plyRating}</p>
                </div>
                {product.maxInflationPressure && (
                  <div>
                    <span className="font-medium">{t('specifications.maxPressure')}</span>
                    <p>{product.maxInflationPressure} PSI</p>
                  </div>
                )}
                {product.maxLoad && (
                  <div>
                    <span className="font-medium">{t('specifications.maxLoad')}</span>
                    <p>{product.maxLoad} lbs</p>
                  </div>
                )}
              </div>
            </TabsContent>            <TabsContent value="performance" className="pt-4">
              <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                <div>
                  <span className="font-medium">{t('performanceTab.treadPattern')}</span>
                  <p>{product.treadPattern}</p>
                </div>
                <div>
                  <span className="font-medium">{t('performanceTab.wetGrip')}</span>
                  <p>{t(`performance.ratings.${product.wetGrip}`) || product.wetGrip} ({product.wetGrip})</p>
                </div>
                <div>
                  <span className="font-medium">{t('performanceTab.fuelEfficiency')}</span>
                  <p>{t(`performance.ratings.${product.fuelEfficiency}`) || product.fuelEfficiency} ({product.fuelEfficiency})</p>
                </div>
                <div>
                  <span className="font-medium">{t('performanceTab.noiseLevel')}</span>
                  <p>{product.noiseLevel} dB</p>
                </div>
                {product.snowRating && (
                  <div>
                    <span className="font-medium">{t('performanceTab.snowRating')}</span>
                    <p>{product.snowRating}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium">{t('performanceTab.utqgRating')}</span>
                  <p>{product.treadwear} / {product.traction} / {product.temperature}</p>
                </div>
                {product.mileageWarranty && (
                  <div>
                    <span className="font-medium">{t('performanceTab.mileageWarranty')}</span>
                    <p>{product.mileageWarranty.toLocaleString()} {t('performanceTab.miles')}</p>
                  </div>
                )}
              </div>
            </TabsContent>            <TabsContent value="details" className="pt-4">
              <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                <div>
                  <span className="font-medium">{t('detailsTab.sku')}</span>
                  <p>{product.sku || t('detailsTab.na')}</p>
                </div>
                <div>
                  <span className="font-medium">{t('detailsTab.manufacturerPart')}</span>
                  <p>{product.manufacturerPartNumber}</p>
                </div>
                <div>
                  <span className="font-medium">{t('detailsTab.brand')}</span>
                  <p>{product.brand.name}</p>
                </div>
                <div>
                  <span className="font-medium">{t('detailsTab.model')}</span>
                  <p>{product.model.name}</p>
                </div>
                <div>
                  <span className="font-medium">{t('detailsTab.category')}</span>
                  <p>{product.category.name}</p>
                </div>
                <div>
                  <span className="font-medium">{t('detailsTab.countryOrigin')}</span>
                  <p>{product.countryOfOrigin}</p>
                </div>
                <div>
                  <span className="font-medium">{t('detailsTab.certifications')}</span>
                  <p>{product.certifications}</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Separator className="my-10" />      {/* Reviews section */}      
      <div className="mt-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-3">
            <Link href={`/products/${product.id}/reviews`}>
              <Button variant="outline">See all reviews</Button>
            </Link>        
          </div>
        </div>        
        
        {product._count.reviews > 0 ? (
          <div>            {/* Display a few featured reviews directly */}            <div className="mb-6 space-y-4">
              
            </div>
            
            {/* Full reviews list in a collapsible section */}
            <div className="mt-4">
              <ReviewsList productId={product.id} />
            </div>
          </div>        ) : (          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
          </div>
        )}

        {/* Write Review button will use a client component */}
    
      </div>

      <Separator className="my-10" />

      {/* Product recommendations */}      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
        <Suspense fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-60 bg-gray-100 animate-pulse rounded" />
            ))}
          </div>
        }>
          <ProductRecommendations 
            productId={product.id}
            categoryId={product.categoryId}
            brandId={product.brandId}
            tireSpecs={{
              width: product.width,
              aspectRatio: product.aspectRatio,
              rimDiameter: product.rimDiameter
            }}
          />
        </Suspense>
      </div>
    </div>
  );
}
