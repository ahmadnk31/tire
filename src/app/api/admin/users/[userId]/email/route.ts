import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { sendEmail } from "@/lib/aws/ses-utils";

// Ensure the request is from an admin
async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return { authorized: false, error: "Unauthorized", status: 401 };
  }
  
  if (session.user.role !== "ADMIN") {
    return { authorized: false, error: "Forbidden", status: 403 };
  }
  
  return { authorized: true };
}

// Schema for sending an email
const emailSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Content is required"),
});

// POST - send email to user
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const authCheck = await ensureAdmin();
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error }, 
      { status: authCheck.status }
    );
  }
  
  try {
    const body = await request.json();
    
    // Validate request data
    const result = emailSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { subject, content } = result.data;
    
    // Get the user email
    const user = await prisma.user.findUnique({
      where: {
        id: params.userId,
      },
      select: {
        email: true,
        name: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
      // Send the email using AWS SES
    await sendEmail(
      user.email,
      subject,
      content,
      // Plain text version of the email (optional)
      content.replace(/<[^>]*>/g, '') // Basic HTML to text conversion
    );
    
    // Log the email for tracking (optional)
    await prisma.emailLog.create({
      data: {
        userId: params.userId,
        subject: subject,
        content: content,
        sentAt: new Date(),
        status: "SENT",
        sentByUserId: (await getServerSession(authOptions))?.user.id || "Unknown",
      },
    });
    
    return NextResponse.json(
      { success: true, message: `Email sent to ${user.email}` },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: error.message },
      { status: 500 }
    );
  }
}
