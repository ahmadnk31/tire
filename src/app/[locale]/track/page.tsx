import { Metadata } from "next"
import TrackingForm from "@/components/tracking/tracking-form"

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Enter your tracking number to see the status of your order",
}

export default function TrackOrderPage() {
  return (
    <div className="container max-w-4xl py-12">
      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Track Your Order</h1>
          <p className="text-muted-foreground">
            Enter your tracking number to check the status of your shipment
          </p>
        </div>
        <TrackingForm />
      </div>
    </div>
  )
}