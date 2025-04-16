import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { 
  createPromotionCampaign, 
  getPromotionCampaigns,
  sendPromotionCampaign,
  createAppointmentPromotionCampaign
} from "@/lib/email/promotion-campaign-service";
import { authOptions } from "@/lib/auth/auth-options";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const promotionId = searchParams.get("promotionId") || undefined;

    // Get campaigns
    const campaigns = await getPromotionCampaigns({ 
      status: status as string | undefined,
      promotionId: promotionId as string | undefined
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("Error handling GET /api/campaigns:", error);
    return NextResponse.json(
      { error: "Failed to get campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    
    // Handle appointment-type campaign creation
    if (data.type === "appointment") {
      if (!data.promotionId || !data.appointmentType) {
        return NextResponse.json(
          { error: "Missing required fields for appointment campaign" },
          { status: 400 }
        );
      }
      
      const campaign = await createAppointmentPromotionCampaign({
        promotionId: data.promotionId,
        appointmentType: data.appointmentType,
      });
      
      return NextResponse.json({ campaign });
    }
    
    // Handle regular campaign creation
    if (!data.promotionId || !data.name || !data.subject || !data.htmlTemplate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const campaign = await createPromotionCampaign({
      promotionId: data.promotionId,
      name: data.name,
      subject: data.subject,
      htmlTemplate: data.htmlTemplate,
      textTemplate: data.textTemplate,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Error handling POST /api/campaigns:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
