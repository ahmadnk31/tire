import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { BadgePercent, Check, Star, Truck } from "lucide-react";
import NewsletterSubscription from "@/components/newsletter-subscription";
import { getTranslations } from "next-intl/server";
import { ProductPriceDisplay } from "@/components/product/product-price-display";

async function getFeaturedProducts() {
  // First try to get featured products
  const featured = await prisma.product.findMany({
    where: {
      isFeatured: true,
      isVisible: true,
    },
    include: {
      brand: true,
      model: true,
    },
    take: 4,
  });
  
  // If we have featured products, return them
  if (featured.length > 0) {
    return featured;
  }
  
  // Otherwise, return the newest products or those with highest discount
  return prisma.product.findMany({
    where: {
      isVisible: true,
    },
    orderBy: [
      { discount: 'desc' },
      { createdAt: 'desc' }
    ],
    include: {
      brand: true,
      model: true,
    },
    take: 4,
  });
}

async function getPopularBrands() {
  return prisma.brand.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      popularityScore: 'desc',
    },
    take: 6,
  });
}

async function getCategories() {
  return prisma.category.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      displayOrder: 'asc',
    },
    take: 4,
  });
}

async function getTestimonials() {
  // Fetch real testimonials from the database
  const testimonials = await prisma.testimonial.findMany({
    where: {
      isVisible: true,
    },
    include: {
      user: {
        select: {
          name: true,
          image: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 3,
  });
  
  // If no testimonials are found, provide fallbacks
  if (!testimonials || testimonials.length === 0) {
    return [
      {
        id: 'fallback-1',
        content: 'I\'m amazed by the quality of the tires I purchased. The delivery was quick and the installation service was excellent. Would definitely recommend!',
        rating: 5,
        customerTitle: 'Car Enthusiast',
        user: {
          name: 'Michael Johnson',
          image: '/placeholder-user.jpg'
        }
      },
      {
        id: 'fallback-2',
        content: 'The tire finder tool made it so easy to find the right tires for my SUV. The prices were competitive and the customer service was outstanding. Very happy!',
        rating: 5,
        customerTitle: 'SUV Owner',
        user: {
          name: 'Sarah Williams',
          image: '/placeholder-user.jpg'
        }
      },
      {
        id: 'fallback-3',
        customerName: 'David Martinez',
        customerImage: '/placeholder-user.jpg',
        content: 'As a retailer, I\'ve been very impressed with the wholesale program. Great inventory selection, competitive pricing, and the team is always responsive to our needs.',
        rating: 5,
      }
    ];
  }
  
  return testimonials;
}

export default async function Home({ params }: { params: { locale: string } }) {
  const t = await getTranslations('Homepage');
  const featuredProducts = await getFeaturedProducts();
  const popularBrands = await getPopularBrands();
  const categories = await getCategories();
  const testimonials = await getTestimonials();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[90vh] sm:h-[80vh] w-full bg-gradient-to-br from-blue-800 via-blue-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 container mx-auto flex flex-col items-center justify-center h-full text-center px-4 py-8">
          <div className="w-full max-w-4xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 tracking-tight leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-10">
              <div className="bg-white/15 backdrop-blur-sm px-3 py-2 sm:px-4 sm:py-3 rounded-lg flex items-center">
                <Check className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mr-1 sm:mr-2" />
                <span className="text-white text-xs sm:text-sm">Premium Quality</span>
              </div>
              <div className="bg-white/15 backdrop-blur-sm px-3 py-2 sm:px-4 sm:py-3 rounded-lg flex items-center">
                <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mr-1 sm:mr-2" />
                <span className="text-white text-xs sm:text-sm">Fast Delivery</span>
              </div>
              <div className="bg-white/15 backdrop-blur-sm px-3 py-2 sm:px-4 sm:py-3 rounded-lg flex items-center">
                <BadgePercent className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mr-1 sm:mr-2" />
                <span className="text-white text-xs sm:text-sm">Special Discounts</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link href="/products" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-blue-500 text-white hover:bg-blue-600 px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base shadow-lg shadow-blue-500/30">
                  {t('hero.shopNow')}
                </Button>
              </Link>
              <Link href="/tire-finder" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white hover:bg-white/20 px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base">
                  {t('hero.searchByVehicle')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">{t('featured.title')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('featured.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
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
                        <p className="text-gray-400">No image</p>
                      </div>
                    )}
                    
                    {product.discount > 0 && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs font-bold rounded">
                        {Math.round(product.discount)}% OFF
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
                    <p className="text-gray-500 text-sm mb-2">{product.brand.name} {product.model.name}</p>
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex flex-col">
                        <ProductPriceDisplay
                          wholesalePrice={product.wholesalePrice}
                          retailPrice={product.retailPrice}
                          salePrice={product.salePrice}
                          discount={product.discount}
                          retailerDiscount={product.retailerDiscount}
                          wholesaleSalePrice={product.wholesaleSalePrice}
                        />
                      </div>
                      <Link href={`/products/${product.id}`}>
                        <Button size="sm" className="bg-gray-900 hover:bg-blue-600 text-white">View Details</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              // Fallback if no featured products
              [1, 2, 3, 4].map((item) => (
                <Card key={item} className="overflow-hidden border border-gray-200">
                  <div className="h-48 bg-gray-100 relative">
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs font-bold rounded">SALE</div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-bold mb-2 text-gray-900">Premium All-Season Tire</h3>
                    <p className="text-gray-500 text-sm mb-2">Brand Model XYZ</p>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-lg font-bold text-blue-700">$129.99</span>
                        <span className="text-gray-400 text-sm ml-2 line-through">$149.99</span>
                      </div>
                      <Button size="sm" className="bg-gray-900 hover:bg-blue-600 text-white">View Details</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          
          <div className="text-center mt-10">
            <Link href="/products">
              <Button size="lg" className="bg-gray-900 text-white hover:bg-blue-600 px-8 shadow-md transition-all duration-300 hover:shadow-lg">
                {t('featured.viewAll')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Brands Section */}
      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">{t('brands.title')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('brands.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {popularBrands.map((brand) => (
              <Link 
                key={brand.id} 
                href={`/brands/${brand.id}`}
                className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center border border-gray-100 hover:border-blue-200"
              >
                <div className="h-20 w-full relative flex items-center justify-center mb-3">
                  {brand.logoUrl ? (
                    <Image 
                      src={brand.logoUrl} 
                      alt={brand.name}
                      width={80}
                      height={80}
                      className="object-contain max-h-full"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-400">{brand.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <h3 className="text-center font-medium text-gray-700">{brand.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">{t('categories.title')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find the perfect tires for your specific needs and driving conditions.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category) => (
              <Link 
                key={category.id} 
                href={`/categories/${category.id}`}
                className="relative overflow-hidden rounded-xl group h-64 shadow-md"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/70 z-10" />
                
                {category.imageUrl ? (
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-800 to-gray-900" />
                )}
                
                <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                  <h3 className="text-xl font-bold text-white mb-2">{category.name}</h3>
                  <span className="inline-flex items-center text-sm text-white group-hover:underline">
                    Browse Collection
                    <svg className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">{t('whyChooseUs.title')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We are committed to providing the best tire shopping experience with these key advantages.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all duration-300">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                  <Check className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{t('whyChooseUs.warranty.title')}</h3>
                <p className="text-gray-600">{t('whyChooseUs.warranty.description')}</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 hover:border-green-200 hover:shadow-md transition-all duration-300">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
                  <BadgePercent className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{t('whyChooseUs.freeShipping.title')}</h3>
                <p className="text-gray-600">{t('whyChooseUs.freeShipping.description')}</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 hover:border-purple-200 hover:shadow-md transition-all duration-300">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-6">
                  <Star className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{t('whyChooseUs.expertAdvice.title')}</h3>
                <p className="text-gray-600">{t('whyChooseUs.expertAdvice.description')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Retailer CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-700 to-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between relative z-10">
          <div className="mb-6 md:mb-0 md:w-2/3">
            <h2 className="text-3xl font-bold mb-4">{t('retailer.title')}</h2>
            <p className="text-lg mb-0 max-w-xl text-blue-100">
              {t('retailer.subtitle')}
            </p>
          </div>
          <div>
            <Link href="/become-retailer">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-gray-100 shadow-lg">
                {t('retailer.learnMore')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">{t('testimonials.title')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('testimonials.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="p-6 border-t-4 border-blue-500 hover:shadow-md transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden mr-4">
                    {testimonial.user && testimonial.user.image ? (
                      <Image 
                        src={testimonial.user.image} 
                        alt={testimonial.user.name || "User"} 
                        width={48} 
                        height={48} 
                        className="object-cover" 
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-800 font-bold">
                        {testimonial.user && testimonial.user.name ? testimonial.user.name.charAt(0) : "?"}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.user ? testimonial.user.name : "Anonymous"}</h4>
                    {testimonial.customerTitle && (
                      <p className="text-sm text-gray-500">{testimonial.customerTitle}</p>
                    )}
                    <div className="flex text-yellow-400">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <svg 
                          key={index} 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-4 w-4 ${index >= (testimonial.rating || 5) ? 'text-gray-300' : ''}`}
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 italic">"{testimonial.content}"</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Subscription Section */}
      <section className="py-16 bg-gradient-to-br from-blue-700 to-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <NewsletterSubscription />
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6">
            {t('hero.ctaTitle')}
          </h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto text-blue-100">
            {t('hero.ctaSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/products">
              <Button size="lg" className="bg-blue-500 text-white hover:bg-blue-600 px-8 py-6 text-lg shadow-lg shadow-blue-500/20">
                {t('hero.shopNow')}
              </Button>
            </Link>
            <Link href="/tire-finder">
              <Button size="lg" variant="outline" className="border-white text-black  hover:bg-white/10 px-8 py-6 text-lg">
                {t('hero.findTires')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
