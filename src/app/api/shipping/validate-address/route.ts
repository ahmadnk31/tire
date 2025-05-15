import { NextResponse } from "next/server";

/**
 * API route to validate shipping addresses with GLS
 * POST /api/shipping/validate-address
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, address } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Authorization token is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://api-sandbox.gls-group.net/address/v2/validate",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(address),
      }
    );

    // If GLS API returns an error
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: `GLS API error: ${response.status}`, details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in address validation API route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
