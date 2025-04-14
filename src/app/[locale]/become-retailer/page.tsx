"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useTranslations } from 'next-intl'

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function BecomeRetailerPage() {
  const t = useTranslations('retailer');
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)
  const [isSubmitted, setIsSubmitted] = React.useState<boolean>(false)

  const retailerFormSchema = z.object({
    name: z.string().min(3, { message: t('form.fields.name.error') }),
    email: z.string().email({ message: t('form.fields.email.error') }),
    companyName: z.string().min(2, { message: t('form.fields.companyName.error') }),
    phone: z.string().min(10, { message: t('form.fields.phone.error') }),
    businessAddress: z.string().min(5, { message: t('form.fields.businessAddress.error') }),
    taxId: z.string().optional(),
    yearsInBusiness: z.string().min(1, { message: t('form.fields.yearsInBusiness.error') }),
    additionalInfo: z.string().optional(),
  })

  type RetailerFormValues = z.infer<typeof retailerFormSchema>

  const form = useForm<RetailerFormValues>({
    resolver: zodResolver(retailerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      companyName: "",
      phone: "",
      businessAddress: "",
      taxId: "",
      yearsInBusiness: "",
      additionalInfo: "",
    },
  })

  async function onSubmit(values: RetailerFormValues) {
    setIsSubmitting(true)
    
    try {
      const response = await fetch("/api/retailer/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || t('notifications.error'))
        return
      }

      setIsSubmitted(true)
      toast.success(t('notifications.success'))
    } catch (error) {
      console.error("Error submitting retailer application:", error)
      toast.error(t('notifications.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="max-w-4xl py-12 container mx-auto">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">{t('success.title')}</CardTitle>
            <CardDescription className="text-center">
              {t('success.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p>{t('success.message1')}</p>
            <p>{t('success.message2')}</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/")}>{t('success.returnButton')}</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl py-12 container mx-auto">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">{t('form.title')}</CardTitle>
          <CardDescription className="text-center">
            {t('form.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.fields.name.label')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('form.fields.name.placeholder')} disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.fields.email.label')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('form.fields.email.placeholder')} type="email" disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.fields.companyName.label')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('form.fields.companyName.placeholder')} disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.fields.phone.label')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('form.fields.phone.placeholder')} disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="businessAddress"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>{t('form.fields.businessAddress.label')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('form.fields.businessAddress.placeholder')} disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.fields.taxId.label')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('form.fields.taxId.placeholder')} disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormDescription>
                        {t('form.fields.taxId.description')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="yearsInBusiness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.fields.yearsInBusiness.label')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('form.fields.yearsInBusiness.placeholder')} disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="additionalInfo"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>{t('form.fields.additionalInfo.label')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t('form.fields.additionalInfo.placeholder')}
                          className="min-h-[120px]"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-center">
                <Button type="submit" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? t('form.submitting') : t('form.submit')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}