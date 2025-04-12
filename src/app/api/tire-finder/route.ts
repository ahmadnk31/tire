import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/tire-finder - Find tires by vehicle or tire dimensions
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  
  // Vehicle search parameters
  const makeId = url.searchParams.get("makeId");
  const modelId = url.searchParams.get("modelId");
  const year = url.searchParams.get("year");
  
  // Tire dimensions parameters
  const width = url.searchParams.get("width");
  const aspectRatio = url.searchParams.get("aspectRatio");
  const rimDiameter = url.searchParams.get("rimDiameter");
  
  // Pagination parameters
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;
  
  try {
    // Search by vehicle
    if (makeId && modelId && year) {
      const yearNum = parseInt(year);
      
      // Find vehicle trims and years that match the criteria
      const vehicleYears = await prisma.vehicleYear.findMany({
        where: {
          year: yearNum,
          trim: {
            model: {
              id: modelId,
              makeId: makeId
            }
          }
        },
        include: {
          trim: {
            include: {
              model: {
                include: {
                  make: true
                }
              }
            }
          }
        }
      });
      
      if (vehicleYears.length === 0) {
        return NextResponse.json({ 
          products: [],
          total: 0,
          page,
          limit,
          message: "No vehicle found with these specifications"
        });
      }
      
      // Get all vehicle year IDs
      const vehicleYearIds = vehicleYears.map(vy => vy.id);
      
      // Find tires that fit these vehicles
      const [tires, total] = await Promise.all([
        prisma.product.findMany({
          where: {
            vehicleFits: {
              some: {
                vehicleYearId: {
                  in: vehicleYearIds
                }
              }
            },
            isVisible: true,
            isDiscontinued: false
          },
          include: {
            brand: true,
            model: true,
            category: true
          },
          skip,
          take: limit,
          orderBy: {
            name: "asc"
          }
        }),
        prisma.product.count({
          where: {
            vehicleFits: {
              some: {
                vehicleYearId: {
                  in: vehicleYearIds
                }
              }
            },
            isVisible: true,
            isDiscontinued: false
          }
        })
      ]);
      
      return NextResponse.json({
        products: tires,
        total,
        page,
        limit,
        vehicleInfo: vehicleYears[0].trim.model.make.name + " " + 
                     vehicleYears[0].trim.model.name + " " + 
                     vehicleYears[0].year
      });
    }
    
    // Search by tire dimensions
    if (width && aspectRatio && rimDiameter) {
      const [tires, total] = await Promise.all([
        prisma.product.findMany({
          where: {
            width: parseInt(width),
            aspectRatio: parseInt(aspectRatio),
            rimDiameter: parseInt(rimDiameter),
            isVisible: true,
            isDiscontinued: false
          },
          include: {
            brand: true,
            model: true,
            category: true
          },
          skip,
          take: limit,
          orderBy: {
            name: "asc"
          }
        }),
        prisma.product.count({
          where: {
            width: parseInt(width),
            aspectRatio: parseInt(aspectRatio),
            rimDiameter: parseInt(rimDiameter),
            isVisible: true,
            isDiscontinued: false
          }
        })
      ]);
      
      return NextResponse.json({
        products: tires,
        total,
        page,
        limit,
        tireSize: `${width}/${aspectRatio}R${rimDiameter}`
      });
    }
    
    // If no valid search parameters provided
    return NextResponse.json(
      { error: "Invalid search parameters provided" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error finding tires:", error);
    return NextResponse.json(
      { error: "Failed to find tires" },
      { status: 500 }
    );
  }
}