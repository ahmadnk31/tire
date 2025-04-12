import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-options"
import { prisma } from "@/lib/db"
import { PerformanceRating, SpeedRating, TireType, TreadwearRating } from "@prisma/client"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData();
    
    // Extract all the fields from the formData
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const sku = formData.get('sku') as string;
    const brandId = formData.get('brandId') as string;
    const modelId = formData.get('modelId') as string;
    const categoryId = formData.get('categoryId') as string;
    const width = parseInt(formData.get('width') as string);
    const aspectRatio = parseInt(formData.get('aspectRatio') as string);
    const rimDiameter = parseInt(formData.get('rimDiameter') as string);
    const loadIndex = parseInt(formData.get('loadIndex') as string);
    const speedRating = formData.get('speedRating') as SpeedRating;
    const treadDepth = parseFloat(formData.get('treadDepth') as string);
    const sidewallType = formData.get('sidewallType') as string;
    const tireType = (formData.get('tireType') as string || 'ALL_SEASON') as TireType;
    const constructionType = formData.get('constructionType') as string;
    const runFlat = formData.get('runFlat') === 'true';
    const reinforced = formData.get('reinforced') === 'true';
    const treadPattern = formData.get('treadPattern') as string;
    const wetGrip = formData.get('wetGrip') as PerformanceRating;
    const fuelEfficiency = formData.get('fuelEfficiency') as PerformanceRating;
    const noiseLevel = formData.get('noiseLevel') as string;
    const snowRating = formData.get('snowRating') as string;
    const treadwear = parseInt(formData.get('treadwear') as string);
    const traction = formData.get('traction') as TreadwearRating;
    const temperature = formData.get('temperature') as TreadwearRating;
    const mileageWarranty = formData.get('mileageWarranty') ? parseInt(formData.get('mileageWarranty') as string) : null;
    const plyRating = parseInt(formData.get('plyRating') as string);
    const maxInflationPressure = formData.get('maxInflationPressure') ? parseInt(formData.get('maxInflationPressure') as string) : null;
    const maxLoad = formData.get('maxLoad') ? parseInt(formData.get('maxLoad') as string) : null;
    const retailPrice = parseFloat(formData.get('retailPrice') as string);
    const wholesalePrice = parseFloat(formData.get('wholesalePrice') as string);
    const discount = formData.get('discount') ? parseFloat(formData.get('discount') as string) : 0;
    const retailerDiscount = formData.get('retailerDiscount') ? parseFloat(formData.get('retailerDiscount') as string) : 0;
    const stock = formData.get('stock') ? parseInt(formData.get('stock') as string) : 0;
    const manufacturerPartNumber = formData.get('manufacturerPartNumber') as string;
    const certifications = formData.get('certifications') as string;
    const countryOfOrigin = formData.get('countryOfOrigin') as string;
    const isVisible = formData.get('isVisible') === 'true';
    const isFeatured = formData.get('isFeatured') === 'true';
    const isDiscontinued = formData.get('isDiscontinued') === 'true';
    console.log("FormData:", formData);

    // Calculate sale prices based on discounts
    const salePrice = retailPrice - (retailPrice * (discount / 100));
    const wholesaleSalePrice = wholesalePrice - (wholesalePrice * (retailerDiscount / 100));
    
    // Extract image URLs - improved extraction logic
    let imageUrls: string[] = [];
    
    // Try to get images from JSON first (this is our new preferred format)
    const imagesJson = formData.get('images');
    if (imagesJson) {
      try {
        // Parse the JSON string array
        const parsedImages = JSON.parse(imagesJson as string);
        if (Array.isArray(parsedImages)) {
          imageUrls = parsedImages;
          console.log("Successfully parsed images from JSON:", imageUrls);
        }
      } catch (e) {
        console.error("Failed to parse images JSON:", e);
      }
    }
    
    // If no images found in JSON, try the array notation method
    if (imageUrls.length === 0) {
      for (let i = 0; ; i++) {
        const imageUrl = formData.get(`images[${i}]`) as string | null;
        if (!imageUrl) break;
        imageUrls.push(imageUrl);
      }
    }
    
    // If still no images, try the array notation with imageUrls prefix
    if (imageUrls.length === 0) {
      for (let i = 0; ; i++) {
        const imageUrl = formData.get(`imageUrls[${i}]`) as string | null;
        if (!imageUrl) break;
        imageUrls.push(imageUrl);
      }
    }
    
    // If still no images, check for comma-separated string
    if (imageUrls.length === 0) {
      const imageUrlsString = formData.get('imageUrls') as string | null;
      if (imageUrlsString && imageUrlsString.includes(',')) {
        imageUrls = imageUrlsString.split(',').filter(url => url.trim().length > 0);
      } else if (imageUrlsString) {
        imageUrls = [imageUrlsString];
      }
    }
    
    console.log("Final imageUrls to be saved:", imageUrls);
    
    // Check required fields
    if (!name || !brandId || !modelId || !categoryId || 
        isNaN(width) || isNaN(aspectRatio) || isNaN(rimDiameter) || isNaN(loadIndex) || 
        !speedRating || !tireType || !sidewallType || !wetGrip || !fuelEfficiency) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields' },
        { status: 400 }
      );
    }

    // Verify the product exists before updating
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.productId }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const product = await prisma.product.update({
      where: {
        id: params.productId,
      },
      data: {
        name,
        description: description || null,
        sku: sku || null,
        brandId,
        modelId,
        categoryId,
        width,
        aspectRatio,
        rimDiameter,
        loadIndex,
        speedRating,
        treadDepth,
        sidewallType,
        tireType,
        constructionType: constructionType || null,
        runFlat,
        reinforced,
        treadPattern,
        wetGrip,
        fuelEfficiency,
        noiseLevel,
        snowRating,
        treadwear,
        traction,
        temperature,
        mileageWarranty,
        plyRating,
        maxInflationPressure,
        maxLoad,
        retailPrice,
        wholesalePrice,
        discount,
        retailerDiscount,
        salePrice,
        wholesaleSalePrice,
        stock,
        manufacturerPartNumber,
        certifications,
        countryOfOrigin,
        isVisible,
        isFeatured,
        isDiscontinued,
        // Always update the images field regardless of whether it's empty or not
        // This ensures we can clear images when needed
        images: imageUrls,
      },
      include: {
        brand: true,
        model: true,
        category: true
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error("[PRODUCT_PATCH]", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch a single product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: {
        id: params.productId,
      },
      include: {
        brand: true,
        model: true,
        category: true,
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("[PRODUCT_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the product exists first
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.productId }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product has associated orders before deleting
    const orderItems = await prisma.orderItem.findFirst({
      where: { productId: params.productId }
    });

    if (orderItems) {
      return NextResponse.json(
        { error: "Cannot delete product that has associated orders" },
        { status: 409 }
      );
    }

    const product = await prisma.product.delete({
      where: {
        id: params.productId,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("[PRODUCT_DELETE]", error);
    
    // Handle foreign key constraint errors
    if (error instanceof Error && error.message.includes('foreign key constraint')) {
      return NextResponse.json(
        { error: "Cannot delete product because it is referenced by other records" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}