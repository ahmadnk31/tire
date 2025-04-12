import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import { authOptions } from "@/lib/auth/auth-options"
import { sendVerificationEmail } from "@/lib/aws/ses-utils"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if email is already verified
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      )
    }

    // Generate new verification token
    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Delete any existing verification tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email }
    })

    // Create new verification token
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires,
      }
    })

    // Send new verification email
    await sendVerificationEmail(user.email, user.name, token)

    return NextResponse.json({
      message: "Verification email sent successfully"
    })
  } catch (error) {
    console.error("Error resending verification email:", error)
    return NextResponse.json(
      { error: "Failed to resend verification email" },
      { status: 500 }
    )
  }
}