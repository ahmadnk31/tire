"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, ArrowRight, PackageOpen, TruckIcon, Calendar } from "lucide-react";
import { toast } from "sonner";


export default function ConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Extract payment_intent from query parameters if coming from Stripe redirect
  const paymentIntent = searchParams.get('payment_intent');
  const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
  const redirectStatus = searchParams.get('redirect_status');

  useEffect(() => {
    // If user navigated directly to this page without an order, redirect to home
    if (!localStorage.getItem('lastOrderNumber') && !paymentIntent) {
      router.replace('/');
      return;
    }

    const getOrderDetails = async () => {
      setIsLoading(true);
      try {
        // If we have a payment intent from Stripe redirect, verify it
        if (paymentIntent && redirectStatus === 'succeeded') {
          const response = await fetch(`/api/orders/verify?paymentIntentId=${paymentIntent}`);
          if (response.ok) {
            const data = await response.json();
            setOrderDetails(data.order);
            // Save order number in local storage for reference
            localStorage.setItem('lastOrderNumber', data.order.orderNumber);
            
            toast.success("Order verified successfully!");
          } else {
            // Handle verification failure
            toast.error("Order verification failed. Please contact customer support.");
            setTimeout(() => router.push('/'), 3000);
          }
        } else {
          // Otherwise retrieve order by number from localStorage
          const orderNumber = localStorage.getItem('lastOrderNumber');
          if (orderNumber) {
            const response = await fetch(`/api/orders/get-by-number?orderNumber=${orderNumber}`);
            if (response.ok) {
              const data = await response.json();
              setOrderDetails(data.order);
            } else {
              // Handle order not found
              toast.error("Order not found. Please contact customer support.");
              setTimeout(() => router.push('/'), 3000);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
        toast.error("Something went wrong. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    getOrderDetails();
    
    // Clean up localStorage on unmount to prevent confusion in future orders
    return () => {
      if (redirectStatus === 'succeeded') {
        localStorage.removeItem('cart');
        localStorage.removeItem('shippingAddress');
        localStorage.removeItem('shippingOption');
      }
    };
  }, [paymentIntent, redirectStatus, router, toast, paymentIntentClientSecret]);

  if (isLoading) {
    return (
      <div className="container max-w-2xl py-20 text-center">
        <div className="animate-pulse space-y-8">
          <div className="mx-auto h-20 w-20 rounded-full bg-primary/20"></div>
          <div className="mx-auto h-8 w-64 rounded bg-primary/20"></div>
          <div className="mx-auto h-4 w-48 rounded bg-primary/20"></div>
          <div className="mx-auto space-y-3">
            <div className="h-4 w-full rounded bg-primary/20"></div>
            <div className="h-4 w-full rounded bg-primary/20"></div>
            <div className="h-4 w-3/4 rounded bg-primary/20"></div>
          </div>
        </div>
      </div>
    );
  }

  // Mock delivery date (two weeks from now)
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 14);
  const formattedDeliveryDate = deliveryDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long', 
    day: 'numeric'
  });

  return (
    <div className="container max-w-2xl py-12 md:py-20">
      <div className="text-center mb-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Thank You For Your Order!</h1>
        <p className="text-muted-foreground">
          {orderDetails ? (
            <>
              Your order #{orderDetails.orderNumber} has been confirmed and will be shipped soon.
              A confirmation email has been sent to your email address.
            </>
          ) : (
            "Your order has been confirmed and will be shipped soon."
          )}
        </p>
      </div>

      {orderDetails && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>
              Order #{orderDetails.orderNumber} - {new Date(orderDetails.createdAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center mb-2">
                <PackageOpen className="h-4 w-4 mr-2 text-primary" />
                <h3 className="font-medium">Products</h3>
              </div>
              <div className="space-y-3 pl-6">
                {orderDetails.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground"> × {item.quantity}</span>
                      <p className="text-sm text-muted-foreground">{item.size}</p>
                    </div>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center mb-2">
                <TruckIcon className="h-4 w-4 mr-2 text-primary" />
                <h3 className="font-medium">Shipping Information</h3>
              </div>
              <div className="space-y-1 pl-6">
                <p>{orderDetails.shippingAddress.firstName} {orderDetails.shippingAddress.lastName}</p>
                <p>{orderDetails.shippingAddress.addressLine1}</p>
                {orderDetails.shippingAddress.addressLine2 && <p>{orderDetails.shippingAddress.addressLine2}</p>}
                <p>
                  {orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.state} {orderDetails.shippingAddress.postalCode}
                </p>
                <p>{orderDetails.shippingAddress.country}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <Calendar className="h-4 w-4 mr-2 text-primary" />
                <h3 className="font-medium">Delivery Information</h3>
              </div>
              <div className="space-y-1 pl-6">
                <p><span className="font-medium">Method:</span> {orderDetails.shipping.name}</p>
                <p><span className="font-medium">Estimated Delivery:</span> {formattedDeliveryDate}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${orderDetails.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>${orderDetails.shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>${orderDetails.tax.toFixed(2)}</span>
              </div>
              {orderDetails.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-${orderDetails.discount.toFixed(2)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-medium text-lg">
                <span>Total</span>
                <span>${orderDetails.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="w-full text-center text-sm text-muted-foreground">
              <p>Payment method: {orderDetails.paymentMethod === "STRIPE" ? "Credit Card" : "PayPal"}</p>
            </div>
          </CardFooter>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button asChild variant="outline" size="lg" className="flex-1">
          <Link href="/dashboard/orders">
            Track Order
          </Link>
        </Button>
        <Button asChild size="lg" className="flex-1">
          <Link href="/products">
            Continue Shopping
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}