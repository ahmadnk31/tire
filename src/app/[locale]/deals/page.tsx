import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { BadgePercent, Clock, Tag } from "lucide-react";

export const metadata = {
  title: "Special Deals & Promotions | Premium Tire Shop",
  description: "Browse our latest special deals, discounts, and promotions on premium tires and services.",
};

async function getDiscountedProducts() {
  const now = new Date();
  
  return prisma.product.findMany({
    where: {
      isVisible: true,
      discount: {
        gt: 0
      }
    },
    include: {
      brand: true,
      model: true,
      category: true,
    },
    orderBy: [
      { discount: 'desc' },
      { isFeatured: 'desc' }
    ],
    take: 12,
  });
}

export default async function DealsPage() {
  const discountedProducts = await getDiscountedProducts();
  
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden mb-12 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <BadgePercent className="h-16 w-16 text-white/90 mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Special Deals & Promotions</h1>
          <p className="text-xl text-white/90 max-w-2xl">
            Get the best prices on premium tires with our exclusive deals and limited-time offers.
          </p>
        </div>
      </div>
      
      {/* Current Promotions */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-gray-900">Current Promotions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="overflow-hidden border border-blue-100 hover:shadow-md transition-all duration-300">
            <div className="h-2 bg-blue-600 w-full"></div>
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="mr-4 mt-1">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                    <BadgePercent className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">Spring Sale: Up to 30% Off</h3>
                  <p className="text-gray-600 mb-4">
                    Enjoy up to 30% off on select all-season and summer tires. Perfect time to prepare for spring and summer driving.
                  </p>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Ends April 30, 2025</span>
                  </div>
                  <Link href="/products?discount=true">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">Shop Now</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border border-green-100 hover:shadow-md transition-all duration-300">
            <div className="h-2 bg-green-600 w-full"></div>
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="mr-4 mt-1">
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                    <Tag className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">Buy 3, Get 1 Free</h3>
                  <p className="text-gray-600 mb-4">
                    Purchase any three tires and get the fourth tire completely free. Available on select brands.
                  </p>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Limited time offer</span>
                  </div>
                  <Link href="/products?promotion=buy3get1">
                    <Button className="w-full bg-green-600 hover:bg-green-700">Learn More</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border border-purple-100 hover:shadow-md transition-all duration-300">
            <div className="h-2 bg-purple-600 w-full"></div>
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="mr-4 mt-1">
                  <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">Rebate Offers</h3>
                  <p className="text-gray-600 mb-4">
                    Get up to $100 mail-in rebate when you purchase a set of four qualifying tires with your credit card.
                  </p>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Valid through May 15, 2025</span>
                  </div>
                  <Link href="/rebates">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">View Details</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Featured Deals */}
      <section>
        <h2 className="text-2xl font-bold mb-8 text-gray-900">Featured Deals</h2>
        
        {discountedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {discountedProducts.map((product) => (
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
                    <span className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded-full ml-2">
                      {product.category.name}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-1 truncate text-gray-900">{product.name}</h3>
                  <p className="text-gray-500 text-sm mb-2">{product.brand.name} {product.model.name}</p>
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex flex-col">
                      {product.salePrice ? (
                        <>
                          <span className="text-lg font-bold text-blue-700">${product.salePrice.toFixed(2)}</span>
                          <span className="text-gray-400 text-sm line-through">${product.retailPrice.toFixed(2)}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-lg font-bold text-blue-700">
                            ${(product.retailPrice * (1 - product.discount / 100)).toFixed(2)}
                          </span>
                          <span className="text-gray-400 text-sm line-through">${product.retailPrice.toFixed(2)}</span>
                        </>
                      )}
                    </div>
                    <Link href={`/products/${product.id}`}>
                      <Button size="sm" className="bg-gray-900 hover:bg-blue-600 text-white">View Details</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-medium text-gray-700 mb-4">No deals available at the moment</h3>
            <p className="text-gray-500 mb-8">Check back soon for new deals and promotions!</p>
            <Link href="/products">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">Browse All Products</Button>
            </Link>
          </div>
        )}
      </section>
      
      {/* Additional Offers */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold mb-8 text-gray-900">Additional Offers</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-pattern opacity-5"></div>
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-4">Service Package Deals</h3>
              <p className="mb-6 text-gray-300">
                Save when you bundle installation services with your tire purchase. Get alignment, balancing, and future rotations at a discounted rate.
              </p>
              <Link href="/installation">
                <Button className="bg-white text-gray-900 hover:bg-gray-100">
                  View Service Packages
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-pattern opacity-5"></div>
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-4">Retailer Special Pricing</h3>
              <p className="mb-6 text-blue-100">
                Authorized retailers can access exclusive wholesale pricing and bulk order discounts. Contact us to learn more about our retailer program.
              </p>
              <Link href="/become-retailer">
                <Button className="bg-white text-blue-700 hover:bg-gray-100">
                  Retailer Program
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Newsletter Signup */}
      <section className="mt-16 bg-gray-50 rounded-xl p-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0 md:mr-8">
            <h3 className="text-xl font-bold mb-2 text-gray-900">Get Deals in Your Inbox</h3>
            <p className="text-gray-600">
              Subscribe to our newsletter to receive exclusive promotions and discounts directly to your email.
            </p>
          </div>
          <div className="w-full md:w-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Your email address"
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[250px]"
              />
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}