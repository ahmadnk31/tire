"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = searchParams.get("locale") || "en"
  const callbackUrl = searchParams.get("callbackUrl") || `/${locale}`
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const t = useTranslations('Auth.login')

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })
  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)

    try {      const response = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl: callbackUrl
      })

      if (response?.error) {
        toast.error("Invalid email or password")
        return
      }

      toast.success("Logged in successfully")
      // Now handle redirection manually after the signIn is complete
      router.push(callbackUrl)
      router.refresh()
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
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">              <FormField
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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('passwordLabel')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="********" 
                        type="password" 
                        autoComplete="current-password"
                        disabled={isLoading} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? t('loggingIn') : t('loginButton')}
              </Button>
            </form>
          </Form>          <div className="mt-4 text-center text-sm">
            <Link href="/forgot-password" className="underline text-primary hover:text-primary/90">
              {t('forgotPassword')}
            </Link>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            {t('noAccount')}{" "}
            <Link href="/register" className="underline text-primary hover:text-primary/90">
              {t('signUpLink')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}