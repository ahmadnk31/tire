import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

// GET all products with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const brand = searchParams.get('brand');
    const category = searchParams.get('category');
    
    const minRetailPrice = searchParams.get('minRetailPrice') ? parseFloat(searchParams.get('minRetailPrice')!) : undefined;
    const maxRetailPrice = searchParams.get('maxRetailPrice') ? parseFloat(searchParams.get('maxRetailPrice')!) : undefined;
    const minWholesalePrice = searchParams.get('minWholesalePrice') ? parseFloat(searchParams.get('minWholesalePrice')!) : undefined;
    const maxWholesalePrice = searchParams.get('maxWholesalePrice') ? parseFloat(searchParams.get('maxWholesalePrice')!) : undefined;
    
    // For backward compatibility
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    
    const width = searchParams.get('width') ? parseInt(searchParams.get('width')!) : undefined;
    const aspectRatio = searchParams.get('aspectRatio') ? parseInt(searchParams.get('aspectRatio')!) : undefined;
    const rimDiameter = searchParams.get('rimDiameter') ? parseInt(searchParams.get('rimDiameter')!) : undefined;
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;
    
    // Build filter object
    const where: any = {};
      if (brand) {
      where.brand = {
        name: {
          equals: brand,
          mode: 'insensitive'
        }
      };
    }
      if (category) {
      where.category = {
        name: {
          equals: category,
          mode: 'insensitive'
        }
      };
    }
      // Special handling for tire type to ensure it matches enum values exactly
    const tireType = searchParams.get('tireType');
    if (tireType) {
      console.log(`Raw tireType parameter received: "${tireType}"`);
      
      // Explicitly create the where condition comparing against the actual database enum values
      // The key issue is ensuring we use the exact enum value formats from the schema
      if (tireType === 'SUMMER') {
        where.tireType = { equals: 'SUMMER' };
      } else if (tireType === 'WINTER') {
        where.tireType = { equals: 'WINTER' };
      } else if (tireType === 'ALL_SEASON') {
        where.tireType = { equals: 'ALL_SEASON' };
      } else if (tireType === 'ALL_TERRAIN') {
        where.tireType = { equals: 'ALL_TERRAIN' };
      } else if (tireType === 'MUD_TERRAIN') {
        where.tireType = { equals: 'MUD_TERRAIN' };
      } else if (tireType === 'HIGH_PERFORMANCE') {
        where.tireType = { equals: 'HIGH_PERFORMANCE' };
      } else if (tireType === 'TOURING') {
        where.tireType = { equals: 'TOURING' };
      } else if (tireType === 'HIGHWAY') {
        where.tireType = { equals: 'HIGHWAY' };
      } else if (tireType === 'COMMERCIAL') {
        where.tireType = { equals: 'COMMERCIAL' };
      } else if (tireType === 'TRACK') {
        where.tireType = { equals: 'TRACK' };
      }
      
      console.log('Final where clause with tireType:', JSON.stringify(where));
    }
    
    if (minRetailPrice !== undefined) {
      where.retailPrice = {
        ...where.retailPrice,
        gte: minRetailPrice
      };
    }
    
    if (maxRetailPrice !== undefined) {
      where.retailPrice = {
        ...where.retailPrice,
        lte: maxRetailPrice
      };
    }
    
    if (minWholesalePrice !== undefined) {
      where.wholesalePrice = {
        ...where.wholesalePrice,
        gte: minWholesalePrice
      };
    }
    
    if (maxWholesalePrice !== undefined) {
      where.wholesalePrice = {
        ...where.wholesalePrice,
        lte: maxWholesalePrice
      };
    }
    
    if (minPrice !== undefined) {
      where.retailPrice = {
        ...where.retailPrice,
        gte: minPrice
      };
    }
    
    if (maxPrice !== undefined) {
      where.retailPrice = {
        ...where.retailPrice,
        lte: maxPrice
      };
    }
    
    if (width !== undefined) {
      where.width = width;
    }
    
    if (aspectRatio !== undefined) {
      where.aspectRatio = aspectRatio;
    }
    
    if (rimDiameter !== undefined) {
      where.rimDiameter = rimDiameter;
    }
    
    // Query products with counts
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              logoUrl: true
            }
          },
          category: {
            select: {
              id: true,
              name: true
            }
          },
          model: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.product.count({ where })
    ]);
    
    return NextResponse.json({
      products,
      meta: {
        currentPage: page,
        pageSize: limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      }
    });
    
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST a new product (admin only)
export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log("Processing product creation request");
    const formData = await request.formData();
    
    // Log form data entries for debugging
    console.log("Form data keys:", Array.from(formData.keys()));
    
    // Extract required fields with validation
    const name = formData.get('name') as string;
    const brandId = formData.get('brandId') as string;
    const modelId = formData.get('modelId') as string;
    const categoryId = formData.get('categoryId') as string;
    
    console.log("Required fields check:", {
      name,
      brandId,
      modelId,
      categoryId
    });
    
    // Check required fields first - modify to make modelId optional if needed
    if (!name || !brandId || !categoryId) {
      const missingFields = [];
      
      if (!name) missingFields.push('name');
      if (!brandId) missingFields.push('brandId');
      if (!categoryId) missingFields.push('categoryId');
      
      console.error('Missing required fields:', missingFields);
      
      return NextResponse.json(
        { error: 'Missing required fields', fields: missingFields },
        { status: 400 }
      );
    }
    
    // If modelId is missing, attempt to find a default model for the brand
    if (!modelId) {
      console.log("modelId missing, attempting to use default model for brand");
      try {
        // Find the first model for this brand
        const defaultModel = await prisma.model.findFirst({
          where: { brandId },
          orderBy: { createdAt: 'asc' }
        });
        
        if (defaultModel) {
          console.log(`Found default model: ${defaultModel.name} (${defaultModel.id})`);
          // Use the first model as default
          formData.append('modelId', defaultModel.id);
        } else {
          console.error("No models found for this brand");
          return NextResponse.json(
            { error: 'No models found for this brand. Please create a model first or specify a modelId.' },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error("Error finding default model:", error);
        return NextResponse.json(
          { error: 'ModelId is required and no default model could be found' },
          { status: 400 }
        );
      }
    }
    
    // Extract and parse other fields with safe parsing
    const description = formData.get('description') as string || null;
    const short_description = formData.get('short_description') as string || null;
    
    // Parse localized descriptions from JSON
    let localized_descriptions: Record<string, string> | null = null;
    let localized_short_descriptions: Record<string, string> | null = null;
    
    try {
      const localizedDescriptionsJson = formData.get('localized_descriptions');
      if (localizedDescriptionsJson) {
        localized_descriptions = JSON.parse(localizedDescriptionsJson as string);
        console.log("Parsed localized descriptions:", localized_descriptions);
      }
      
      const localizedShortDescriptionsJson = formData.get('localized_short_descriptions');
      if (localizedShortDescriptionsJson) {
        localized_short_descriptions = JSON.parse(localizedShortDescriptionsJson as string);
        console.log("Parsed localized short descriptions:", localized_short_descriptions);
      }
    } catch (e) {
      console.error("Error parsing localized descriptions:", e);
    }
    
    // Safely parse numeric values with fallbacks
    const width = parseIntSafe(formData.get('width') as string);
    const aspectRatio = parseIntSafe(formData.get('aspectRatio') as string);
    const rimDiameter = parseIntSafe(formData.get('rimDiameter') as string);
    const loadIndex = parseIntSafe(formData.get('loadIndex') as string);
    const retailPrice = parseFloatSafe(formData.get('retailPrice') as string);
    const wholesalePrice = parseFloatSafe(formData.get('wholesalePrice') as string);
    
    // Check core product dimensions
    if (width === null || aspectRatio === null || rimDiameter === null || 
        loadIndex === null || retailPrice === null || wholesalePrice === null) {
      const missingTechFields = [];
      if (width === null) missingTechFields.push('width');
      if (aspectRatio === null) missingTechFields.push('aspectRatio');
      if (rimDiameter === null) missingTechFields.push('rimDiameter');
      if (loadIndex === null) missingTechFields.push('loadIndex');
      if (retailPrice === null) missingTechFields.push('retailPrice');
      if (wholesalePrice === null) missingTechFields.push('wholesalePrice');
      
      console.error('Invalid or missing technical fields:', missingTechFields);
      
      return NextResponse.json(
        { error: 'Invalid or missing technical specifications', fields: missingTechFields },
        { status: 400 }
      );
    }
    
    // Get optional fields
    const speedRating = formData.get('speedRating') as string || null;
    
    // Safely parse optional numeric values
    const treadDepth = parseFloatSafe(formData.get('treadDepth') as string);
    const treadwear = parseIntSafe(formData.get('treadwear') as string);
    const plyRating = parseIntSafe(formData.get('plyRating') as string);
    const mileageWarranty = parseIntSafe(formData.get('mileageWarranty') as string);
    const discount = parseFloatSafe(formData.get('discount') as string) || 0;
    const retailerDiscount = parseFloatSafe(formData.get('retailerDiscount') as string) || 0;
    const stock = parseIntSafe(formData.get('stock') as string) || 0;
    
    // Parse boolean values
    const runFlat = formData.get('runFlat') === 'true';
    const reinforced = formData.get('reinforced') === 'true';
    
    // Get string optional fields
    const sidewallType = formData.get('sidewallType') as string || null;
    const treadPattern = formData.get('treadPattern') as string || null;
    const wetGrip = formData.get('wetGrip') as string || null;
    const fuelEfficiency = formData.get('fuelEfficiency') as string || null;
    const noiseLevel = formData.get('noiseLevel') as string || null;
    const snowRating = formData.get('snowRating') as string || null;
    const traction = formData.get('traction') as string || null;
    const temperature = formData.get('temperature') as string || null;
    const manufacturerPartNumber = formData.get('manufacturerPartNumber') as string || null;
    const certifications = formData.get('certifications') as string || null;    const countryOfOrigin = formData.get('countryOfOrigin') as string || null;
    
    // Get custom attributes if provided
    let attributes = {};
    const attributesJson = formData.get('attributes');
    if (attributesJson) {
      try {
        // Handle empty string or invalid JSON
        if (attributesJson === '') {
          attributes = {};
        } else {
          attributes = JSON.parse(attributesJson as string);
        }
        
        // Convert to Record<string, string> by ensuring all values are strings
        attributes = Object.entries(attributes).reduce((acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        }, {} as Record<string, string>);
        
        console.log("Parsed custom attributes:", attributes);
      } catch (e) {
        console.error("Failed to parse attributes JSON:", e);
        // Provide an empty object as fallback
        attributes = {};
      }
    }
    // Extract image URLs and keys
    let imageUrls: string[] = [];
    
    // First try to get images from JSON format
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
    
    // If still no images, try the original imageUrls format as fallback
    if (imageUrls.length === 0) {
      for (let i = 0; ; i++) {
        const imageUrl = formData.get(`imageUrls[${i}]`) as string | null;
        if (!imageUrl) break;
        imageUrls.push(imageUrl);
      }
    }
    
    console.log("Final imageUrls to be saved:", imageUrls);
    
    // Additional fields from schema
    const tireType = formData.get('tireType') as string || 'ALL_SEASON';
    const constructionType = formData.get('constructionType') as string || null;
    const maxInflationPressure = parseIntSafe(formData.get('maxInflationPressure') as string);
    const maxLoad = parseIntSafe(formData.get('maxLoad') as string);
    
    // Visibility flags
    const isVisible = formData.get('isVisible') === 'true';
    const isFeatured = formData.get('isFeatured') === 'true';
    const isDiscontinued = formData.get('isDiscontinued') === 'true';
    
    // Calculate sale prices based on discounts (these are percentage discounts)
    const salePrice = retailPrice - (retailPrice * (discount / 100));
    const wholesaleSalePrice = wholesalePrice - (wholesalePrice * (retailerDiscount / 100));
      // Create product data object with only valid fields
    const productData: any = {
      name,
      description,
      short_description,
      localized_descriptions,
      localized_short_descriptions,
      attributes,
      brandId,
      modelId,
      categoryId,
      width,
      aspectRatio,
      rimDiameter,
      loadIndex,
      retailPrice,
      wholesalePrice,
      discount,
      retailerDiscount,
      stock,
      runFlat,
      reinforced,
      images: imageUrls,
      tireType,
      constructionType,
      maxInflationPressure,
      maxLoad,
      isVisible,
      isFeatured,
      isDiscontinued,
      salePrice,
      wholesaleSalePrice,
    };
    
    // Add optional fields only if they have values
    if (speedRating) productData.speedRating = speedRating;
    if (treadDepth !== null) productData.treadDepth = treadDepth;
    if (sidewallType) productData.sidewallType = sidewallType;
    if (treadPattern) productData.treadPattern = treadPattern;
    if (wetGrip) productData.wetGrip = wetGrip;
    if (fuelEfficiency) productData.fuelEfficiency = fuelEfficiency;
    if (noiseLevel) productData.noiseLevel = noiseLevel;
    if (snowRating) productData.snowRating = snowRating;
    if (treadwear !== null) productData.treadwear = treadwear;
    if (traction) productData.traction = traction;
    if (temperature) productData.temperature = temperature;
    if (mileageWarranty !== null) productData.mileageWarranty = mileageWarranty;
    if (plyRating !== null) productData.plyRating = plyRating;
    if (manufacturerPartNumber) productData.manufacturerPartNumber = manufacturerPartNumber;
    if (certifications) productData.certifications = certifications;
    if (countryOfOrigin) productData.countryOfOrigin = countryOfOrigin;
    
    console.log("Creating product with data:", productData);
    
    // Create the product
    const product = await prisma.product.create({
      data: productData,
      include: {
        brand: true,
        model: true,
        category: true
      }
    });
    
    return NextResponse.json(product, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating product:', error);
    
    // More detailed error response
    return NextResponse.json(
      { 
        error: 'Failed to create product',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}

// Helper functions for safe parsing
function parseIntSafe(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = parseInt(value);
  return isNaN(parsed) ? null : parsed;
}

function parseFloatSafe(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}