"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function VerifyRequiredPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isResending, setIsResending] = React.useState(false)
  const t = useTranslations('Auth.verifyRequired')

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
        throw new Error(t("alert.error"))
      }

      toast.success(t("alert.success"))
    } catch (error) {
      console.error("Error resending verification email:", error)
      toast.error(t("alert.error"))
    } finally {
      setIsResending(false)
    }
  }
  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{t("title")}</CardTitle>
          <CardDescription className="text-center">
            {t("description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            {t("message")}
          </p>
          <div className="flex flex-col items-center gap-2">
            <Button
              variant="outline"
              onClick={handleResendEmail}
              disabled={isResending}
            >
              {isResending ? t("button.sending") : t("button.resend")}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button
            variant="ghost"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            {t("button.signOut")}
          </Button>
          <Button
            variant="default"
            onClick={() => router.push("/")}
          >
            {t("button.returnHome")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}