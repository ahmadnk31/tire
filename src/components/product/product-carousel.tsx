'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from '@/components/ui/carousel'
import { cn } from '@/lib/utils'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'

type Product = {
  id: string
  name: string
  images?: string[]
  width: number
  aspectRatio: number
  rimDiameter: number
  brand: { name: string }
  retailPrice: number
  salePrice?: number | null
  discount?: number
}

interface ProductCarouselProps {
  images?: string[]
  alt?: string
  className?: string
  autoplay?: boolean
  autoplayDelay?: number
  productName?: string
  products?: Product[]
}

export function ProductCarousel({ 
  images, 
  alt, 
  className,
  autoplay = false,
  autoplayDelay = 5000,
  productName,
  products
}: ProductCarouselProps) {
  // If products are provided, we're in products carousel mode
  if (products) {
    return <ProductsCarousel products={products} autoplay={autoplay} autoplayDelay={autoplayDelay} className={className} />
  }
  
  // Otherwise, we're in single product image carousel mode
  return <SingleProductCarousel 
    images={images || []} 
    alt={alt || productName || 'Product'} 
    autoplay={autoplay} 
    autoplayDelay={autoplayDelay}
    className={className}
  />
}

function SingleProductCarousel({
  images,
  alt,
  autoplay = false,
  autoplayDelay = 5000,
  className
}: {
  images: string[]
  alt: string
  autoplay?: boolean
  autoplayDelay?: number
  className?: string
}) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const plugins = autoplay ? [
    Autoplay({
      delay: autoplayDelay,
      stopOnInteraction: true,
    }) as any
  ] : undefined
  
  const [mainViewportRef, mainEmblaApi] = useEmblaCarousel({ 
    loop: true,
    skipSnaps: false
  }, plugins)
  
  const [thumbViewportRef, thumbEmblaApi] = useEmblaCarousel({
    containScroll: 'keepSnaps',
    dragFree: true,
  })

  // This effect runs when the main carousel is selected (scrolled)
  useEffect(() => {
    if (!mainEmblaApi || !thumbEmblaApi) return

    const onSelect = () => {
      if (!mainEmblaApi) return
      const index = mainEmblaApi.selectedScrollSnap()
      setSelectedIndex(index)
      thumbEmblaApi?.scrollTo(index)
    }

    mainEmblaApi.on('select', onSelect)
    // Initial selection
    onSelect()
    
    return () => {
      mainEmblaApi.off('select', onSelect)
    }
  }, [mainEmblaApi, thumbEmblaApi])
  
  // Handle thumbnail click to change main image
  const handleThumbClick = (index: number) => {
    if (!mainEmblaApi) return
    // Important: Use scrollTo instead of direct state manipulation
    mainEmblaApi.scrollTo(index)
    // We don't need to set selected index here as it will be handled by the select event
  }

  if (!images || images.length === 0) {
    return (
      <div className={cn("aspect-square relative bg-gray-100 rounded-lg flex items-center justify-center", className)}>
        <div className="text-gray-400">No image available</div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        <div className="overflow-hidden rounded-xl" ref={mainViewportRef}>
          <div className="flex">
            {images.map((image, i) => (
              <div 
                key={i} 
                className="flex-[0_0_100%] min-w-0 relative aspect-square overflow-hidden bg-gray-100"
              >
                <Image
                  src={image}
                  alt={`${alt} image ${i+1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain"
                  priority={i === 0}
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </div>
            ))}
          </div>
        </div>
        <button 
          className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-2 shadow-md z-10"
          onClick={() => mainEmblaApi?.scrollPrev()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <button 
          className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-2 shadow-md z-10"
          onClick={() => mainEmblaApi?.scrollNext()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>

      {images.length > 1 && (
        <div className="relative">
          <div 
            className="overflow-hidden" 
            ref={thumbViewportRef}
          >
            <div className="flex gap-2">
              {images.map((image, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-[0_0_23%] min-w-0 cursor-pointer aspect-square relative overflow-hidden rounded-lg bg-gray-100 transition-all duration-300",
                    selectedIndex === i ? "ring-2 ring-black" : "opacity-70 hover:opacity-100"
                  )}
                  onClick={() => handleThumbClick(i)}
                >
                  <Image
                    alt={`${alt} thumbnail ${i+1}`}
                    src={image}
                    fill
                    sizes="80px"
                    className="object-contain p-1"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductsCarousel({
  products,
  autoplay = true,
  autoplayDelay = 5000,
  className
}: {
  products: Product[]
  autoplay?: boolean
  autoplayDelay?: number
  className?: string
}) {
  const plugins = autoplay ? [
    Autoplay({
      delay: autoplayDelay,
      stopOnInteraction: true,
    }) as any
  ] : undefined
  
  const [emblaRef] = useEmblaCarousel({ 
    loop: true,
    align: "start",
    skipSnaps: false,
  }, plugins)

  if (!products || products.length === 0) {
    return null
  }

  return (
    <div className={className}>
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
        ref={emblaRef}
      >
        <CarouselContent>
          {products.map((product) => (
            <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
              <Link href={`/products/${product.id}`} className="group cursor-pointer p-4 block">
                <div className="aspect-square relative mb-4 bg-gray-100 rounded-xl overflow-hidden">
                  <Image
                    src={product.images && product.images.length > 0 ? product.images[0] : "/placeholder.svg"}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 33vw, 25vw"
                    className="object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {product.discount && product.discount > 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {product.discount}% OFF
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">{product.brand.name}</p>
                  <h3 className="font-semibold truncate">{product.name}</h3>
                  <p className="text-sm text-gray-700">{product.width}/{product.aspectRatio}R{product.rimDiameter}</p>
                  <div className="flex items-baseline gap-2">
                    {product.salePrice ? (
                      <>
                        <p className="font-medium">${product.salePrice.toFixed(2)}</p>
                        <p className="text-sm text-gray-500 line-through">${product.retailPrice.toFixed(2)}</p>
                      </>
                    ) : (
                      <p className="font-medium">${product.retailPrice.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-4 sm:left-0" />
        <CarouselNext className="-right-4 sm:right-0" />
      </Carousel>
    </div>
  )
}