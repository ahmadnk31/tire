"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [isEmailSent, setIsEmailSent] = React.useState<boolean>(false)
  const t = useTranslations('Auth.forgotPassword')

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(data: ForgotPasswordFormValues) {
    setIsLoading(true)

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        toast.error(responseData.message || "Something went wrong")
        return
      }

      // Even if the email doesn't exist, show success message for security reasons
      setIsEmailSent(true)
      toast.success("If your email exists in our system, you will receive a password reset link")
    } catch (error) {
      toast.error("Something went wrong")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{t('title')}</CardTitle>
          <CardDescription className="text-center">
            {t('subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>          {isEmailSent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                {t('emailSentMessage')}
              </p>
              <Button 
                onClick={() => router.push("/login")}
                className="w-full"
              >
                {t('backToLogin')}
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('emailLabel')}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('emailPlaceholder')} 
                          type="email" 
                          autoComplete="email"
                          disabled={isLoading} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? t('sendingReset') : t('resetButton')}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            {t('rememberPassword')}{" "}
            <Link href="/login" className="underline text-primary hover:text-primary/90">
              {t('backToLogin')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}