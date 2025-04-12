"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  const [isLoading, setIsLoading] = React.useState<boolean>(true)
  const [isVerified, setIsVerified] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!token) {
      setIsLoading(false)
      setError("Verification token is missing")
      return
    }

    async function verifyEmail() {
      try {
        const response = await fetch(`/api/verify-email?token=${token}`, {
          method: "GET",
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || "Verification failed")
          toast.error(data.error || "Verification failed")
        } else {
          setIsVerified(true)
          toast.success("Email verified successfully!")
        }
      } catch (error) {
        console.error("Verification error:", error)
        setError("Something went wrong during verification")
        toast.error("Something went wrong during verification")
      } finally {
        setIsLoading(false)
      }
    }

    verifyEmail()
  }, [token])

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isLoading 
              ? "Verifying Email" 
              : isVerified 
                ? "Email Verified" 
                : "Verification Failed"
            }
          </CardTitle>
          <CardDescription className="text-center">
            {isLoading 
              ? "Please wait while we verify your email address..." 
              : isVerified 
                ? "Your email has been verified successfully. You can now sign in to your account." 
                : "We couldn't verify your email address."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : isVerified ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-green-100 p-3">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-8 w-8 text-green-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Thank you for verifying your email. We've sent you a welcome email with more information about our services.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-red-100 p-3">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-8 w-8 text-red-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </div>
              <p className="text-center text-sm text-destructive">
                {error || "The verification link is invalid or has expired."}
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Please try registering again or contact our support team for assistance.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {!isLoading && (
            isVerified ? (
              <Button onClick={() => router.push("/login")}>
                Sign in to your account
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/register">Register again</Link>
              </Button>
            )
          )}
        </CardFooter>
      </Card>
    </div>
  )
}