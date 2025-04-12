"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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

const retailerFormSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters" }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 characters" }),
  businessAddress: z.string().min(5, { message: "Business address must be at least 5 characters" }),
  taxId: z.string().optional(),
  yearsInBusiness: z.string().min(1, { message: "Please specify years in business" }),
  additionalInfo: z.string().optional(),
})

type RetailerFormValues = z.infer<typeof retailerFormSchema>

export default function BecomeRetailerPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)
  const [isSubmitted, setIsSubmitted] = React.useState<boolean>(false)

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
        toast.error(data.error || "Failed to submit application")
        return
      }

      setIsSubmitted(true)
      toast.success("Your retailer application has been submitted successfully")
    } catch (error) {
      console.error("Error submitting retailer application:", error)
      toast.error("Something went wrong. Please try again later.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className=" max-w-4xl py-12 container mx-auto">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Application Submitted</CardTitle>
            <CardDescription className="text-center">
              Thank you for your interest in becoming a retailer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p>Your application has been received and is under review.</p>
            <p>Our team will review your information and get back to you via email within 2-3 business days.</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/")}>Return to Homepage</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl py-12 container mx-auto">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Become a Retailer</CardTitle>
          <CardDescription className="text-center">
            Apply to join our network of tire retailers and gain access to wholesale pricing
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
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" disabled={isSubmitting} {...field} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="example@example.com" type="email" disabled={isSubmitting} {...field} />
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
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Tire Shop" disabled={isSubmitting} {...field} />
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
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="123-456-7890" disabled={isSubmitting} {...field} />
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
                      <FormLabel>Business Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, City, State, Zip" disabled={isSubmitting} {...field} />
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
                      <FormLabel>Tax ID (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Tax ID or Business License #" disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormDescription>
                        For wholesale verification purposes only
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
                      <FormLabel>Years in Business</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 5" disabled={isSubmitting} {...field} />
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
                      <FormLabel>Additional Information (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us more about your business and why you'd like to become a retailer"
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
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}