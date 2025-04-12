import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { prisma } from "@/lib/db";

interface BrandPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: BrandPageProps) {
    const {id}=await params
  const brand = await prisma.brand.findUnique({
    where: { id: id },
    include:{
        products:true
    }
  });
  console.log(`brand`, brand)
  if (!brand) {
    return {
      title: "Brand Not Found",
      description: "The requested brand could not be found",
    };
  }
  
  return {
    title: `${brand.name} Tires | Premium Tire Shop`,
    description: brand.description || `Shop our collection of ${brand.name} tires for all vehicle types.`,
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
  
  return brand;
}

export default async function BrandDetailPage({ params }: BrandPageProps) {
    const {id}=await params
  const brand = await getBrandWithProductsAndModels(id);
  console.log(`brand products with models `, brand)
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
              <h1 className="text-4xl font-bold text-gray-900">{brand.name} Tires</h1>
              {brand.description && (
                <p className="text-gray-600 mt-2 max-w-3xl">
                  {brand.description}
                </p>
              )}
            </div>
          </div>
          <Link href="/brands">
            <Button variant="outline" className="shrink-0">
              All Brands
            </Button>
          </Link>
        </div>
      </div>
      
      {brand.models.length > 0 ? (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-8 flex flex-wrap h-auto">
            <TabsTrigger value="all" className="mb-2">All Products</TabsTrigger>
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
                      <p className="text-gray-500 text-sm mb-2">{product.model.name}</p>
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
                        <Link href={`/products/${product.id}`}>
                          <Button size="sm" className="bg-gray-900 hover:bg-blue-600 text-white">View Details</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-2xl font-medium text-gray-700 mb-4">No products found from this brand</h3>
                <p className="text-gray-500 mb-8">We're working on adding products from this brand. Please check back soon.</p>
                <Link href="/products">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">Browse All Products</Button>
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
                          <Link href={`/products/${product.id}`}>
                            <Button size="sm" className="bg-gray-900 hover:bg-blue-600 text-white">View Details</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-2xl font-medium text-gray-700 mb-4">No products found in this model</h3>
                  <p className="text-gray-500 mb-8">We're working on adding products from this model. Please check back soon.</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-2xl font-medium text-gray-700 mb-4">No products found from this brand</h3>
          <p className="text-gray-500 mb-8">We're working on adding products from this brand. Please check back soon.</p>
          <Link href="/products">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">Browse All Products</Button>
          </Link>
        </div>
      )}
    </div>
  );
}