"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const t = useTranslations('Auth.verifyEmail')
  
  const [isLoading, setIsLoading] = React.useState<boolean>(true)
  const [isVerified, setIsVerified] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!token) {
      setIsLoading(false)
      setError(t("message.missing"))
      return
    }

    async function verifyEmail() {
      try {
        const response = await fetch(`/api/verify-email?token=${token}`, {
          method: "GET",
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || t("message.failed"))
          toast.error(data.error || t("message.failed"))
        } else {
          setIsVerified(true)
          toast.success(t("description.verified"))
        }
      } catch (error) {
        console.error("Verification error:", error)
        setError(t("error.general"))
        toast.error(t("error.general"))
      } finally {
        setIsLoading(false)
      }
    }

    verifyEmail()
  }, [token, t])
  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isLoading 
              ? t("title.verifying")
              : isVerified 
                ? t("title.verified")
                : t("title.failed")
            }
          </CardTitle>
          <CardDescription className="text-center">
            {isLoading 
              ? t("description.verifying")
              : isVerified 
                ? t("description.verified")
                : t("description.failed")
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
                {t("message.verified")}
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
                {error || t("message.failed")}
              </p>
              <p className="text-center text-sm text-muted-foreground">
                {t("message.help")}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {!isLoading && (
            isVerified ? (
              <Button onClick={() => router.push("/login")}>
                {t("button.signIn")}
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/register">{t("button.register")}</Link>
              </Button>
            )
          )}
        </CardFooter>
      </Card>
    </div>
  )
}