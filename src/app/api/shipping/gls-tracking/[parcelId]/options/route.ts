import { NextRequest, NextResponse } from "next/server";

/**
 * API route to get GLS parcel delivery options
 * GET /api/shipping/gls-tracking/:parcelId/options
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { parcelId: string } }
) {
  try {
    const parcelId = params.parcelId;
    const searchParams = request.nextUrl.searchParams;
    const postalCode = searchParams.get("postalCode");
    const key = searchParams.get("key");
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Authentication token is required" },
        { status: 401 }
      );
    }

    // Build the query string with optional parameters
    const queryParams = new URLSearchParams();
    if (postalCode) queryParams.append("postalCode", postalCode);
    if (key) queryParams.append("key", key);
    const queryString = queryParams.toString()
      ? `?${queryParams.toString()}`
      : "";

    // Call the GLS API with authentication
    const response = await fetch(
      `https://api-sandbox.gls-group.net/change-delivery-v1/delivery-options/${parcelId}/options${queryString}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

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

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in GLS tracking:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
