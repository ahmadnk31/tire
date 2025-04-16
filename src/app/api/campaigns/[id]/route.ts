import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { 
  getPromotionCampaignById, 
  updatePromotionCampaign,
  deletePromotionCampaign,
  sendPromotionCampaign
} from "@/lib/email/promotion-campaign-service";

export async function GET(
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
    const campaign = await getPromotionCampaignById(id);

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error(`Error handling GET /api/campaigns/${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to get campaign" },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const data = await request.json();

    // Convert scheduledFor string to Date if provided
    if (data.scheduledFor) {
      data.scheduledFor = new Date(data.scheduledFor);
    }

    const campaign = await updatePromotionCampaign(id, data);

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error(`Error handling PUT /api/campaigns/${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    await deletePromotionCampaign(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error handling DELETE /api/campaigns/${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}
