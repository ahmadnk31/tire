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
import { CheckCircle2, ArrowRight, PackageOpen, TruckIcon, Calendar, Printer } from "lucide-react";
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
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6 animate-bounce">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Thank You For Your Order!</h1>
        <div className="text-muted-foreground">
          {orderDetails ? (
            <>
              <p className="mb-2">
                Your order <span className="font-medium">#{orderDetails.orderNumber}</span> has been confirmed and will be shipped soon.
              </p>
              <p>
                A confirmation email has been sent to <span className="font-medium">{orderDetails.shippingAddress.email}</span>.
              </p>
            </>
          ) : (
            "Your order has been confirmed and will be shipped soon."
          )}
        </div>
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
                    <span>€{(item.price * item.quantity).toFixed(2)}</span>
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
                <span>€{orderDetails.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>€{orderDetails.shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>€{orderDetails.tax.toFixed(2)}</span>
              </div>
              {orderDetails.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-€{orderDetails.discount.toFixed(2)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-medium text-lg">
                <span>Total</span>
                <span>€{orderDetails.total.toFixed(2)}</span>
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
        <Button 
          variant="outline" 
          size="lg" 
          className="flex-1"
          onClick={() => {
            // Create a print-friendly version with just the order details
            const printWindow = window.open('', '_blank');
            if (printWindow) {
              printWindow.document.write(`
                <html>
                  <head>
                    <title>Order Receipt #${orderDetails?.orderNumber}</title>
                    <style>
                      body { font-family: Arial, sans-serif; padding: 20px; }
                      .header { text-align: center; margin-bottom: 20px; }
                      h1 { margin: 0; }
                      .order-info { margin-bottom: 30px; }
                      table { width: 100%; border-collapse: collapse; }
                      th { text-align: left; border-bottom: 1px solid #ddd; padding: 8px; }
                      td { padding: 8px; border-bottom: 1px solid #eee; }
                      .total { font-weight: bold; }
                      .footer { margin-top: 30px; text-align: center; font-size: 12px; }
                      .section { margin: 20px 0; }
                    </style>
                  </head>
                  <body>
                    <div class="header">
                      <h1>Order Receipt</h1>
                      <p>Order #${orderDetails?.orderNumber} - ${new Date(orderDetails?.createdAt).toLocaleDateString()}</p>
                    </div>
                    
                    <div class="order-info">
                      <div class="section">
                        <h3>Shipping Information</h3>
                        <p>${orderDetails?.shippingAddress.firstName} ${orderDetails?.shippingAddress.lastName}</p>
                        <p>${orderDetails?.shippingAddress.addressLine1}</p>
                        ${orderDetails?.shippingAddress.addressLine2 ? `<p>${orderDetails.shippingAddress.addressLine2}</p>` : ''}
                        <p>${orderDetails?.shippingAddress.city}, ${orderDetails?.shippingAddress.state} ${orderDetails?.shippingAddress.postalCode}</p>
                        <p>${orderDetails?.shippingAddress.country}</p>
                        <p>Email: ${orderDetails?.shippingAddress.email}</p>
                        ${orderDetails?.shippingAddress.phone ? `<p>Phone: ${orderDetails.shippingAddress.phone}</p>` : ''}
                      </div>
                      
                      <div class="section">
                        <h3>Delivery Information</h3>
                        <p><strong>Method:</strong> ${orderDetails?.shipping.name}</p>
                        <p><strong>Estimated Delivery:</strong> ${formattedDeliveryDate}</p>
                      </div>
                    </div>
                    
                    <h3>Order Items</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Quantity</th>
                          <th>Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${orderDetails?.items.map((item: any) => `
                          <tr>
                            <td>${item.name} ${item.size ? `<br><span style="font-size: 12px;">${item.size}</span>` : ''}</td>
                            <td>${item.quantity}</td>
                            <td>€${item.price.toFixed(2)}</td>
                            <td>€${(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        `).join('')}
                        <tr>
                          <td colspan="3" style="text-align: right;">Subtotal</td>
                          <td>€${orderDetails?.subtotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td colspan="3" style="text-align: right;">Shipping</td>
                          <td>€${orderDetails?.shippingCost.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td colspan="3" style="text-align: right;">Tax</td>
                          <td>€${orderDetails?.tax.toFixed(2)}</td>
                        </tr>
                        ${orderDetails?.discount > 0 ? `
                          <tr>
                            <td colspan="3" style="text-align: right; color: green;">Discount</td>
                            <td style="color: green;">-€${orderDetails.discount.toFixed(2)}</td>
                          </tr>
                        ` : ''}
                        <tr class="total">
                          <td colspan="3" style="text-align: right;">Total</td>
                          <td>€${orderDetails?.total.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                    
                    <div class="footer">
                      <p>Thank you for your order!</p>
                      <p>Payment method: ${orderDetails?.paymentMethod === "STRIPE" ? "Credit Card" : "PayPal"}</p>
                      <p>If you have any questions, please contact our customer service.</p>
                    </div>
                  </body>
                </html>
              `);
              printWindow.document.close();
              printWindow.focus();
              // Slight delay to ensure content is loaded
              setTimeout(() => printWindow.print(), 500);
            }
          }}
        >
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt
        </Button>
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