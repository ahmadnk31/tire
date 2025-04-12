"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function VerifyRequiredPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isResending, setIsResending] = React.useState(false)

  const handleResendEmail = async () => {
    setIsResending(true)
    try {
      const response = await fetch("/api/verify-email/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session?.user?.email,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to resend verification email")
      }

      alert("Verification email has been resent. Please check your inbox.")
    } catch (error) {
      console.error("Error resending verification email:", error)
      alert("Failed to resend verification email. Please try again later.")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Email Verification Required</CardTitle>
          <CardDescription className="text-center">
            Please verify your email address to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            We sent a verification link to your email address. Please check your inbox and click the link to verify your account.
          </p>
          <div className="flex flex-col items-center gap-2">
            <Button
              variant="outline"
              onClick={handleResendEmail}
              disabled={isResending}
            >
              {isResending ? "Sending..." : "Resend verification email"}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button
            variant="ghost"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Sign out
          </Button>
          <Button
            variant="default"
            onClick={() => router.push("/")}
          >
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}