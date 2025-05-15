import { NextResponse } from "next/server";
import { TransitShipment } from "@/types/gls-shipping";

/**
 * API route to create transit shipments with GLS
 * POST /api/shipping/gls-transit-shipments
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, transitShipment } = body as {
      token: string;
      transitShipment: TransitShipment;
    };

    if (!token) {
      return NextResponse.json(
        { error: "Authorization token is required" },
        { status: 400 }
      );
    }

    if (!transitShipment) {
      return NextResponse.json(
        { error: "Transit shipment data is required" },
        { status: 400 }
      );
    }

    // Validate required fields at the API level
    if (
      !transitShipment.parcelNumbers ||
      transitShipment.parcelNumbers.length === 0
    ) {
      return NextResponse.json(
        { error: "At least one parcel number is required" },
        { status: 400 }
      );
    }

    if (
      !transitShipment.exporter ||
      !transitShipment.importer ||
      !transitShipment.lineItems
    ) {
      return NextResponse.json(
        { error: "Exporter, importer, and line items are required" },
        { status: 400 }
      );
    }

    // Make the API call to GLS
    const response = await fetch(
      "https://api-sandbox.gls-group.net/customs-management/export/public/v3/transit-shipments",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(transitShipment),
      }
    );

    // Handle non-successful responses
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `HTTP error ${response.status}` };
      }

      return NextResponse.json(
        {
          error: `GLS API error: ${response.status}`,
          details: errorData,
        },
        { status: response.status }
      );
    }

    // Return the successful response
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in GLS transit shipment creation:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
