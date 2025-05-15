import { NextResponse } from "next/server";

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

    // Updated API endpoint URL with the correct structure
    const response = await fetch(
      "https://api-sandbox.gls-group.net/api/address/v2/validate",
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
    console.error("Error in GLS address validation API route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
