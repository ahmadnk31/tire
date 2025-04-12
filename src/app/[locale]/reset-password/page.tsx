"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import Link from "next/link"

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const resetPasswordSchema = z.object({
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [isSuccess, setIsSuccess] = React.useState<boolean>(false)
  const [isInvalidToken, setIsInvalidToken] = React.useState<boolean>(false)

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  // Validate token when page loads
  React.useEffect(() => {
    if (!token) {
      setIsInvalidToken(true)
      return
    }

    async function validateToken() {
      try {
        const response = await fetch(`/api/validate-reset-token?token=${token}`, {
          method: "GET",
        })

        if (!response.ok) {
          setIsInvalidToken(true)
        }
      } catch (error) {
        console.error(error)
        setIsInvalidToken(true)
      }
    }

    validateToken()
  }, [token])

  async function onSubmit(data: ResetPasswordFormValues) {
    if (!token) {
      toast.error("Invalid reset token")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        toast.error(responseData.message || "Something went wrong")
        return
      }

      setIsSuccess(true)
      toast.success("Password reset successfully")
    } catch (error) {
      toast.error("Something went wrong")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isInvalidToken) {
    return (
      <div className="container flex items-center justify-center min-h-screen py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Invalid or Expired Link</CardTitle>
            <CardDescription className="text-center">
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link href="/forgot-password">Request a new link</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Your password has been reset successfully.
              </p>
              <Button 
                onClick={() => router.push("/login")}
                className="w-full"
              >
                Sign in with new password
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="********" 
                          type="password" 
                          autoComplete="new-password"
                          disabled={isLoading} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="********" 
                          type="password" 
                          autoComplete="new-password"
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
                  {isLoading ? "Resetting password..." : "Reset password"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}