import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { sendPromotionCampaign } from "@/lib/email/promotion-campaign-service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params.id;
    const result = await sendPromotionCampaign(id);

    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error handling POST /api/campaigns/${params.id}/send:`, error);
    return NextResponse.json(
      { error: "Failed to send campaign", message: (error as Error).message },
      { status: 500 }
    );
  }
}
