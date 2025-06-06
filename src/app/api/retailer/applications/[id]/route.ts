import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import { authOptions } from "@/lib/auth/auth-options"
import { hash } from "bcryptjs"
import { z } from "zod"
import { sendEmail } from "@/lib/aws/ses-utils"

// Type for route parameters
type Params = {
  params: {
    id: string
  }
}

// Schema for updating application status
const updateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  password: z.string().min(8).optional(), // Required only for approval
})

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateSchema.safeParse(body)

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 }
      )
    }

    const { status } = validatedData.data

    // Find the retailer request
    const retailerRequest = await prisma.retailerRequest.findUnique({
      where: { id: params.id }
    })

    if (!retailerRequest) {
      return NextResponse.json(
        { error: "Retailer request not found" },
        { status: 404 }
      )
    }

    // Update the retailer request status
    await prisma.retailerRequest.update({
      where: { id: params.id },
      data: { status }
    })

    let user = null

    // If approved, create or update user account with retailer role
    if (status === "APPROVED") {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: retailerRequest.email }
      })

      const hashedPassword = existingUser ? undefined : await hash("TempPass123!", 12)

      if (existingUser) {
        // Update existing user to retailer role
        user = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: "RETAILER",
            retailerProfile: {
              create: {
                companyName: retailerRequest.companyName,
                phone: retailerRequest.phone,
                businessAddress: retailerRequest.businessAddress,
                taxId: retailerRequest.taxId,
                yearsInBusiness: retailerRequest.yearsInBusiness,
              }
            }
          }
        })
      } else {
        // Create new retailer user
        user = await prisma.user.create({
          data: {
            name: retailerRequest.name,
            email: retailerRequest.email,
            password: hashedPassword!,
            role: "RETAILER",
            retailerProfile: {
              create: {
                companyName: retailerRequest.companyName,
                phone: retailerRequest.phone,
                businessAddress: retailerRequest.businessAddress,
                taxId: retailerRequest.taxId,
                yearsInBusiness: retailerRequest.yearsInBusiness,
              }
            }
          }
        })
      }

      // Send approval email with login credentials
      const emailSubject = "Your Retailer Application Has Been Approved"
      const emailHtml = `
        <h1>Welcome to Our Tire Shop!</h1>
        <p>Dear ${retailerRequest.name},</p>
        <p>We are pleased to inform you that your retailer application has been approved!</p>
        ${!existingUser ? `
        <p>You can now log in to your retailer account using:</p>
        <ul>
          <li>Email: ${retailerRequest.email}</li>
          <li>Temporary Password: TempPass123!</li>
        </ul>
        <p><strong>Important:</strong> Please change your password immediately after logging in.</p>
        ` : `
        <p>Your existing account has been upgraded to a retailer account. You can continue using your current login credentials.</p>
        `}
        <p>You now have access to wholesale pricing and retailer-specific features.</p>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
      `
      const emailText = `
        Welcome to Our Tire Shop!

        Dear ${retailerRequest.name},

        We are pleased to inform you that your retailer application has been approved!
        ${!existingUser ? `
        You can now log in to your retailer account using:
        Email: ${retailerRequest.email}
        Temporary Password: TempPass123!

        Important: Please change your password immediately after logging in.
        ` : `
        Your existing account has been upgraded to a retailer account. You can continue using your current login credentials.
        `}
        You now have access to wholesale pricing and retailer-specific features.

        If you have any questions, please don't hesitate to contact our support team.
      `

      await sendEmail(retailerRequest.email, emailSubject, emailHtml, emailText)
    } else if (status === "REJECTED") {
      // Send rejection email
      const emailSubject = "Update on Your Retailer Application"
      const emailHtml = `
        <h1>Retailer Application Update</h1>
        <p>Dear ${retailerRequest.name},</p>
        <p>Thank you for your interest in becoming a retailer with our tire shop.</p>
        <p>After careful review of your application, we regret to inform you that we are unable to approve your retailer account at this time.</p>
        <p>You are welcome to apply again in the future if your circumstances change.</p>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
      `
      const emailText = `
        Retailer Application Update

        Dear ${retailerRequest.name},

        Thank you for your interest in becoming a retailer with our tire shop.

        After careful review of your application, we regret to inform you that we are unable to approve your retailer account at this time.

        You are welcome to apply again in the future if your circumstances change.

        If you have any questions, please don't hesitate to contact our support team.
      `

      await sendEmail(retailerRequest.email, emailSubject, emailHtml, emailText)
    }

    return NextResponse.json({
      message: `Application ${status.toLowerCase()} successfully`,
      user
    })
  } catch (error) {
    console.error("Error processing retailer application:", error)
    return NextResponse.json(
      { error: "Failed to process application" },
      { status: 500 }
    )
  }
}