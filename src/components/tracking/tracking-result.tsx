"use client"

import { format } from "date-fns"
import { CheckCircle, Clock, Package, Truck } from "lucide-react"
import { TrackingResponse, TrackingStatus } from "@/lib/shipping/shipping-interfaces"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface TrackingResultProps {
  tracking: TrackingResponse
}

export default function TrackingResult({ tracking }: TrackingResultProps) {
  const getStatusIcon = (status: TrackingStatus) => {
    switch (status) {
      case TrackingStatus.DELIVERED:
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case TrackingStatus.OUT_FOR_DELIVERY:
        return <Truck className="h-6 w-6 text-blue-500" />
      case TrackingStatus.IN_TRANSIT:
        return <Truck className="h-6 w-6 text-blue-500" />
      case TrackingStatus.PICKED_UP:
        return <Package className="h-6 w-6 text-purple-500" />
      case TrackingStatus.CREATED:
        return <Clock className="h-6 w-6 text-orange-500" />
      case TrackingStatus.EXCEPTION:
        return <Clock className="h-6 w-6 text-red-500" />
      default:
        return <Clock className="h-6 w-6 text-gray-500" />
    }
  }

  const getStatusColor = (status: TrackingStatus) => {
    switch (status) {
      case TrackingStatus.DELIVERED:
        return "bg-green-500"
      case TrackingStatus.OUT_FOR_DELIVERY:
        return "bg-blue-500"
      case TrackingStatus.IN_TRANSIT:
        return "bg-blue-500"
      case TrackingStatus.PICKED_UP:
        return "bg-purple-500"
      case TrackingStatus.CREATED:
        return "bg-orange-500"
      case TrackingStatus.EXCEPTION:
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: TrackingStatus) => {
    switch (status) {
      case TrackingStatus.DELIVERED:
        return "Delivered"
      case TrackingStatus.OUT_FOR_DELIVERY:
        return "Out for Delivery"
      case TrackingStatus.IN_TRANSIT:
        return "In Transit"
      case TrackingStatus.PICKED_UP:
        return "Picked Up"
      case TrackingStatus.CREATED:
        return "Shipment Created"
      case TrackingStatus.EXCEPTION:
        return "Delivery Exception"
      default:
        return "Unknown Status"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <span className="text-sm text-muted-foreground">Tracking Number</span>
            <div>{tracking.trackingNumber}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <span className="text-sm text-muted-foreground">Status</span>
              <div className="font-medium">{getStatusText(tracking.currentStatus)}</div>
            </div>
            {getStatusIcon(tracking.currentStatus)}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {tracking.estimatedDeliveryDate && (
          <div className="mb-4 rounded-md bg-muted p-3">
            <div className="text-sm text-muted-foreground">Estimated Delivery</div>
            <div className="font-medium">
              {format(new Date(tracking.estimatedDeliveryDate), "MMMM d, yyyy")}
            </div>
          </div>
        )}

        <div className="mt-6">
          <h3 className="mb-4 text-lg font-medium">Tracking History</h3>
          <div className="space-y-6">
            {tracking.events.map((event, index) => (
              <div key={index} className="relative pl-8">
                {index !== tracking.events.length - 1 && (
                  <Separator
                    orientation="vertical"
                    className="absolute left-[0.6rem] top-6 h-full w-[1px]"
                  />
                )}
                <div
                  className={cn(
                    "absolute left-0 top-1 h-3 w-3 rounded-full",
                    getStatusColor(event.status)
                  )}
                />
                <div className="space-y-1">
                  <p className="font-medium">{event.description}</p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>{event.location}</span>
                    <span className="mx-2">•</span>
                    <span>
                      {format(new Date(event.timestamp), "MMM d, yyyy h:mm a")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {tracking.providerName && (
          <div className="mt-6 text-right text-sm text-muted-foreground">
            Shipping via {tracking.providerName}
          </div>
        )}
      </CardContent>
    </Card>
  )
}