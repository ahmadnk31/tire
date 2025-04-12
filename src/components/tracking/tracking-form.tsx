"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { TrackingResponse } from "@/lib/shipping/shipping-interfaces"
import TrackingResult from "./tracking-result"

const formSchema = z.object({
  trackingNumber: z.string().min(1, {
    message: "Tracking number is required",
  }),
})

export default function TrackingForm() {
  const [trackingResult, setTrackingResult] = useState<TrackingResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      trackingNumber: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)
    setTrackingResult(null)

    try {
      const response = await fetch(`/api/shipping/track?trackingNumber=${values.trackingNumber}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to track shipment")
      }

      setTrackingResult(data.trackingInfo)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="trackingNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tracking Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your tracking number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="mr-2">Tracking...</span>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              </>
            ) : (
              "Track Shipment"
            )}
          </Button>
        </form>
      </Form>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {trackingResult && <TrackingResult tracking={trackingResult} />}
    </div>
  )
}