"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ShippingOption, useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  CreditCard, 
  AlertCircle, 
  Check, 
  Clock,
  ShieldCheck,
  LockIcon,
  AppleIcon,
  SmartphoneIcon
} from "lucide-react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import Link from "next/link";
import Image from "next/image";
import { 
  PaymentElement,
  LinkAuthenticationElement,
  AddressElement,
  Elements,
  useStripe,
  useElements,
  PaymentRequestButtonElement
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { ShippingService } from '@/lib/shipping/shipping-service';

// Load Stripe outside of component to avoid recreation on renders
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// PayPal client ID from env
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;

// Type for the create payment intent response
interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

// Type for payment error specifics
interface PaymentErrorDetails {
  code: string;
  message: string;
  technical?: string;
}

// Stripe Payment Form Component
function StripePaymentForm({ 
  total, 
  onSuccess, 
  onError 
}: { 
  total: number; 
  onSuccess: () => void; 
  onError: (message: string, details?: PaymentErrorDetails) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [email, setEmail] = useState('');
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);
  
  // Set up payment request for Apple Pay/Google Pay
  useEffect(() => {
    if (stripe) {
      const pr = stripe.paymentRequest({
        country: 'BE',
        currency: 'eur',
        total: {
          label: 'Ariana Banden Centraal BV',
          amount: Math.round(total * 100),
        },
        requestPayerEmail: true,
        requestPayerName: true,
      });
      
      // Check if payment request can be used
      pr.canMakePayment().then(result => {
        if (result) {
          setPaymentRequest(pr);
          setCanMakePayment(true);
        }
      });
      
      // Handle payment request success
      pr.on('paymentmethod', async (e) => {
        setIsProcessing(true);
        
        try {
          if (!elements) {
            throw new Error('Stripe Elements not initialized');
          }
          
          const {error: confirmError} = await stripe.confirmPayment({
            elements,
            confirmParams: {
              return_url: `${window.location.origin}/checkout/confirmation`,
              payment_method: e.paymentMethod.id,
              receipt_email: email,
            },
            redirect: 'if_required'
          });
          
          if (confirmError) {
            e.complete('fail');
            onError(confirmError.message || 'Payment failed', {
              code: confirmError.code || 'unknown',
              message: confirmError.message || 'Payment failed'
            });
          } else {
            e.complete('success');
            onSuccess();
          }
        } catch (err) {
          console.error('Express payment error:', err);
          e.complete('fail');
          onError('An unexpected error occurred with express payment', {
            code: 'express_payment_error',
            message: 'Express payment failed'
          });
        } finally {
          setIsProcessing(false);
        }
      });
    }
  }, [stripe, total, onSuccess, onError, email, elements]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/confirmation`,
          receipt_email: email,
          save_payment_method: savePaymentMethod,
        },
        redirect: 'if_required'
      });
      
      if (error) {
        // Show specific error to customer
        const errorDetails: PaymentErrorDetails = {
          code: error.code || 'unknown',
          message: error.message || 'An unexpected error occurred',
          technical: error.type || 'unknown_error'
        };
        
        onError(getCustomerFriendlyErrorMessage(error), errorDetails);
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        onSuccess();
      } else if (paymentIntent) {
        // Handle specific payment states
        if (paymentIntent.status === 'processing') {
          onError('Your payment is processing. We\'ll update you when payment is received.', {
            code: 'processing',
            message: 'Payment is processing'
          });
        } else if (paymentIntent.status === 'requires_action') {
          onError('Additional authentication is required. Please complete the verification.', {
            code: 'authentication_required',
            message: 'Additional authentication required'
          });
        } else {
          onError(`Payment status: ${paymentIntent.status}. Please wait a moment.`, {
            code: paymentIntent.status,
            message: `Payment status: ${paymentIntent.status}`
          });
        }
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Payment error:', err);
      onError('An unexpected error occurred. Please try again.', {
        code: 'unexpected_error',
        message: 'An unexpected error occurred'
      });
      setIsProcessing(false);
    }
  };
  
  // Provide more friendly error messages based on Stripe error codes
  const getCustomerFriendlyErrorMessage = (error: any): string => {
    switch (error.code) {
      case 'card_declined':
        return 'Your card was declined. Please try a different payment method.';
      case 'expired_card':
        return 'Your card is expired. Please try a different card.';
      case 'incorrect_cvc':
        return 'The security code (CVC) is incorrect. Please check and try again.';
      case 'processing_error':
        return 'An error occurred while processing your card. Please try again in a moment.';
      case 'insufficient_funds':
        return 'Your card has insufficient funds. Please try a different payment method.';
      case 'invalid_expiry_year':
      case 'invalid_expiry_month':
        return 'The expiration date on your card is invalid. Please check and try again.';
      default:
        return error.message || 'An error occurred with your payment. Please try again.';
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <LinkAuthenticationElement 
        options={{
          defaultValues: {
            email: email,
          },
        }}
        onChange={(e) => {
          if (e.value.email) setEmail(e.value.email);
        }}
      />
      
      {canMakePayment && paymentRequest && (
        <div className="space-y-4">
          <div className="text-sm font-medium">Express Checkout</div>
          <PaymentRequestButtonElement 
            options={{
              paymentRequest,
              style: {
                paymentRequestButton: {
                  theme: 'dark',
                  height: '44px',
                }
              }
            }}
          />
          <Separator />
          <div className="text-sm font-medium">Or pay with card</div>
        </div>
      )}
      
      <PaymentElement />
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="savePaymentMethod" 
          checked={savePaymentMethod}
          onCheckedChange={(checked) => setSavePaymentMethod(checked === true)}
        />
        <label
          htmlFor="savePaymentMethod"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Save this card for future payments
        </label>
      </div>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-green-600" />
        <span>Your payment info is secure and encrypted</span>
      </div>
      
      <Button 
        disabled={!stripe || isProcessing} 
        type="submit"
        className="w-full"
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing...</span>
          </div>
        ) : (
          <span>Pay ${total.toFixed(2)}</span>
        )}
      </Button>
    </form>
  );
}

export default function PaymentPage() {
  // Remove the state for shippingService since it's a static class
  const router = useRouter();
  const { 
    items, 
    summary, 
    shippingAddress, 
    selectedShippingOption,
    setSelectedShippingOption,
    clearCart 
  } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal" | "wallet">("stripe");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentErrorDetails, setPaymentErrorDetails] = useState<PaymentErrorDetails | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [paymentProgress, setPaymentProgress] = useState(0);
  const [isOrderReviewed, setIsOrderReviewed] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);

  // Check if required info is available and create payment intent
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Redirect if shipping information is missing
      if (!shippingAddress || !selectedShippingOption) {
        router.replace("/checkout");
        return;
      }
      
      // Redirect if cart is empty
      if (items.length === 0) {
        router.replace("/cart");
        return;
      }
      
      // Create a payment intent on component mount
      const createIntent = async () => {
        setIsLoading(true);
        try {
          // Show a realistic progress indicator during payment initialization
          const progressInterval = setInterval(() => {
            setPaymentProgress(prev => {
              if (prev >= 90) {
                clearInterval(progressInterval);
                return prev;
              }
              return prev + 10;
            });
          }, 300);
          
          const response = await fetch('/api/payments/create-intent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: Math.round(summary.total * 100), // Convert to cents
              currency: 'eur',
              metadata: {
                orderId: `order_${Date.now()}`,
                items: JSON.stringify(items.map(item => ({
                  id: item.id,
                  name: item.name,
                  quantity: item.quantity,
                  price: item.price
                }))),
                customer: JSON.stringify({
                  name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
                  email: shippingAddress.email,
                  address: {
                    line1: shippingAddress.addressLine1,
                    line2: shippingAddress.addressLine2 || '',
                    city: shippingAddress.city,
                    state: shippingAddress.state,
                    postal_code: shippingAddress.postalCode,
                    country: shippingAddress.country,
                  }
                }),
                shipping_method: selectedShippingOption.name,
              }
            }),
          });
          
          clearInterval(progressInterval);
          
          if (!response.ok) {
            throw new Error('Failed to create payment intent');
          }
          
          const data: CreatePaymentIntentResponse = await response.json();
          setClientSecret(data.clientSecret);
          setPaymentIntentId(data.paymentIntentId);
          setPaymentProgress(100);
        } catch (error) {
          console.error('Error creating payment intent:', error);
          setPaymentError('Failed to initialize payment. Please try again.');
          toast.error('Failed to initialize payment. Please try again.');
        } finally {
          setIsLoading(false);
        }
      };
      
      createIntent();
    }
  }, [items, shippingAddress, selectedShippingOption, router, summary.total, toast]);

  // Fetch available shipping options using the shipping service
  useEffect(() => {
    async function fetchShippingOptions() {
      if (shippingAddress && items.length > 0) {
        try {
          // Use configured shipping service to get rates
          const rates = await ShippingService.getRates({
            // Convert our ShippingAddress format to the RateRequest format expected by the service
            shipperAddress: {
              contactName: "Shipper",
              companyName: "Ariana Banden Centraal BV",
              phone: "1234567890",
              email: "shipping@example.com",
              addressLine1: "Provinciebaan 192A",
              city: "Ledegem",
              state: "WESTVLAANDEREN",
              postalCode: "8880",
              countryCode: "BE" // Default to BE if not provided
            },
            recipientAddress: {
              contactName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
              phone: shippingAddress.phone || "",
              email: shippingAddress.email,
              addressLine1: shippingAddress.addressLine1,
              addressLine2: shippingAddress.addressLine2,
              city: shippingAddress.city,
              state: shippingAddress.state,
              postalCode: shippingAddress.postalCode,
              countryCode: shippingAddress.country.substring(0, 2) || "BE" // Use first 2 chars or default to BE
            },
            packages: items.map(item => ({
              weight: item.weight || 1,
              length: item.dimensions?.length || 10,
              width: item.dimensions?.width || 10,
              height: item.dimensions?.height || 10,
              description: item.name
            })),
            isResidential: true
          });
          
          // Transform rates to shipping options format
          const options: ShippingOption[] = rates.map(rate => ({
            id: rate.rateId || `${rate.providerName}-${rate.serviceType}`,
            name: `${rate.providerName} ${rate.serviceType}`,
            description: `${rate.transitDays ? `Delivery in ${rate.transitDays} days` : 'Standard delivery'}`,
            price: rate.totalAmount,
            estimatedDelivery: rate.deliveryDate ? 
              `Estimated delivery: ${new Date(rate.deliveryDate).toLocaleDateString()}` : 
              'Delivery time varies',
            provider: rate.providerName,
            serviceLevel: rate.serviceType
          }));
          
          // Update shipping options in the cart context
          setShippingOptions(options);
          
          // If we already have a selectedShippingOption from checkout
          if (selectedShippingOption) {
            // Try to find the matching option in the new options
            const matchedOption = options.find(
              option => option.id === selectedShippingOption.id || 
                     option.name === selectedShippingOption.name
            );
            
            // If we found a match, use that (might have updated price/details)
            if (matchedOption) {
              setSelectedShippingOption(matchedOption);
            } 
            // Otherwise keep the current selection but ensure the context is updated
            else if (options.length > 0) {
              setSelectedShippingOption(selectedShippingOption);
            }
          }
          // If no shipping option is selected yet, select the first one
          else if (options.length > 0) {
            setSelectedShippingOption(options[0]);
          }
        } catch (error) {
          console.error('Error fetching shipping rates:', error);
          toast.error('Unable to fetch shipping options. Using default options.');
          
          // If the shipping service fails, fall back to the default options
          // from cart context but keep the selected option if it exists
          if (selectedShippingOption) {
            // No need to change, keep using the selected option from checkout
          } else if (shippingOptions.length > 0) {
            setSelectedShippingOption(shippingOptions[0]);
          }
        }
      }
    }
    
    fetchShippingOptions();
  }, [shippingAddress, items, selectedShippingOption, setSelectedShippingOption, setShippingOptions]);

  // Format price to display with 2 decimal places
  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  // Handle successful payment
  const handleSuccessfulPayment = async () => {
    setIsProcessing(true);
    
    try {
      // Create the order in the database first
      const orderCreated = await createOrder();
      
      if (!orderCreated) {
        throw new Error('Failed to create order');
      }
      
      // Only proceed with success state after order is created
      setPaymentSuccess(true);
      toast.success('Payment successful!');
      
      // Redirect to confirmation page
      setTimeout(() => {
        clearCart();
        router.push("/checkout/confirmation");
      }, 2000);
    } catch (error) {
      console.error('Error finalizing payment:', error);
      setPaymentError('Payment was processed but we encountered an issue creating your order. Please contact customer support.');
      toast.error('Error finalizing your order. Please contact support with your payment confirmation.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Create order in database
  const createOrder = async () => {
    try {
      // Validate that we have shipping information
      if (!selectedShippingOption) {
        toast.error('Please select a shipping option');
        return false;
      }

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          total: summary.total,
          subtotal: summary.subtotal,
          tax: summary.tax,
          shipping: summary.shipping,
          discount: summary.discount,
          shippingAddress,
          shippingMethod: selectedShippingOption,
          paymentIntentId: paymentIntentId || `manual_${Date.now()}`,
          paymentMethod,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create order');
      }
      
      const data = await response.json();
      // Store order number in local storage for reference
      if (data.orderNumber) {
        localStorage.setItem('lastOrderNumber', data.orderNumber);
      }
      
      return true;
    } catch (error) {
      console.error('Error creating order:', error);
      return false;
    }
  };

  // Handle PayPal payment
  const handlePayPalPayment = async (data: any) => {
    setIsProcessing(true);
    setPaymentError(null);
    
    try {
      // Create the order in the database first
      const orderCreated = await createOrder();
      
      if (!orderCreated) {
        throw new Error('Failed to create order');
      }
      
      // Get the order number from localStorage 
      const orderNumber = localStorage.getItem('lastOrderNumber');
      
      // Show progress indicator for PayPal payment processing
      toast.loading('Processing PayPal payment...');
      
      console.log('PayPal payment data:', data);
      
      // Capture the PayPal payment on your server
      const response = await fetch('/api/payments/capture-paypal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderID: data.orderID,
          items,
          shipping: shippingAddress,
          summary,
          orderNumber // Include orderNumber for server-side order update
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to capture PayPal payment';
        throw new Error(errorMessage);
      }
      
      const captureData = await response.json();
      toast.dismiss();
      
      if (!captureData.success) {
        throw new Error('PayPal payment was not successful');
      }
      
      // Save the PayPal transaction ID with consistent formatting
      const formattedTransactionId = captureData.transactionId.startsWith('pp_') 
        ? captureData.transactionId
        : `pp_${captureData.transactionId}`;
        
      setPaymentIntentId(formattedTransactionId);
      
      // Handle successful payment - already created order above
      setPaymentSuccess(true);
      toast.success('Payment successful!');
      
      // Redirect to confirmation page
      setTimeout(() => {
        clearCart();
        router.push("/checkout/confirmation");
      }, 2000);
    } catch (error: any) {
      console.error('PayPal payment error:', error);
      toast.dismiss();
      
      const errorMessage = error.message || 'Failed to process PayPal payment. Please try again.';
      setPaymentError(errorMessage);
      setPaymentErrorDetails({
        code: 'paypal_processing_error',
        message: errorMessage,
        technical: 'Error during PayPal payment capture process'
      });
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle shipping option change - memoized with useCallback
  const handleShippingOptionChange = useCallback((option: ShippingOption) => {
    // Set the selected shipping option in the cart context
    setSelectedShippingOption(option);
    // No need to call setSummary directly since it's handled by the cart context
  }, [setSelectedShippingOption]);

  // Content to display when payment is successful
  if (paymentSuccess) {
    return (
      <div className="container max-w-md py-16 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
        <p className="mb-8 text-muted-foreground">
          Your order has been placed and confirmation details will be sent to your email.
        </p>
        <div className="flex justify-center">
          <div className="animate-pulse flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Redirecting to order confirmation...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-12">
      <div className="mb-8">
        <Link 
          href="/checkout" 
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Shipping
        </Link>
        <h1 className="text-3xl font-bold mt-2">Payment</h1>
        <div className="w-full mt-4 flex items-center gap-2">
          <div className="bg-primary rounded-full w-3 h-3"></div>
          <div className="h-1 bg-primary w-32"></div>
          <div className="bg-primary rounded-full w-3 h-3"></div>
          <div className="h-1 bg-primary w-32"></div>
          <div className="bg-primary-foreground border border-primary rounded-full w-3 h-3"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Methods */}
        <div className="lg:col-span-2">
          {!isOrderReviewed ? (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <h2 className="text-xl font-semibold">Review Your Order</h2>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Order Items ({items.length})</h3>
                    <div className="mt-2 space-y-4">
                      {items.map(item => (
                        <div key={item.id} className="flex items-center gap-4">
                          {item.image && (
                            <div className="w-16 h-16 rounded border overflow-hidden">
                              <Image 
                                src={item.image} 
                                alt={item.name} 
                                width={64} 
                                height={64} 
                                className="object-cover w-full h-full"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Quantity: {item.quantity}
                            </div>
                          </div>
                          <div className="font-medium">${formatPrice(item.price * item.quantity)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-2">Shipping Address</h3>
                      {shippingAddress && (
                        <div className="text-sm space-y-1">
                          <p className="font-medium">{shippingAddress.firstName} {shippingAddress.lastName}</p>
                          <p>{shippingAddress.addressLine1}</p>
                          {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
                          <p>
                            {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
                          </p>
                          <p>{shippingAddress.country}</p>
                          <p className="mt-1">{shippingAddress.email}</p>
                          {shippingAddress.phone && <p>{shippingAddress.phone}</p>}
                        </div>
                      )
                      }
                    
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Shipping Method</h3>
                      {selectedShippingOption && (
                        <div className="text-sm space-y-1">
                          <p className="font-medium">{selectedShippingOption.name}</p>
                          <p>{selectedShippingOption.description}</p>
                          <p>{selectedShippingOption.estimatedDelivery}</p>
                          <p className="font-medium">${formatPrice(selectedShippingOption.price)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium mb-2">Order Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>${formatPrice(summary.subtotal)}</span>
                      </div>
                      
                      {summary.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount</span>
                          <span>-${formatPrice(summary.discount)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>${formatPrice(summary.shipping)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>Tax</span>
                        <span>${formatPrice(summary.tax)}</span>
                      </div>
                      
                      <Separator className="my-2" />
                      
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span>${formatPrice(summary.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-end">
                <Button onClick={() => setIsOrderReviewed(true)}>
                  Proceed to Payment
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <LockIcon className="h-4 w-4 text-green-600" />
                <h2 className="text-xl font-semibold">Secure Payment</h2>
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <div className="py-12 space-y-4">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
                      <p className="text-muted-foreground">Initializing payment...</p>
                    </div>
                    <Progress value={paymentProgress} className="w-full h-2" />
                  </div>
                ) : (
                  <Tabs 
                    value={paymentMethod} 
                    onValueChange={(value) => setPaymentMethod(value as "stripe" | "paypal" | "wallet")}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                      <TabsTrigger value="stripe" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Credit Card</span>
                      </TabsTrigger>
                      <TabsTrigger value="paypal" className="flex items-center gap-2">
                        <Image 
                          src="/images/paypal-logo.svg" 
                          alt="PayPal" 
                          width={16} 
                          height={16} 
                          className="h-4 w-auto"
                        />
                        <span>PayPal</span>
                      </TabsTrigger>
                      <TabsTrigger value="wallet" className="flex items-center gap-2">
                        <SmartphoneIcon className="h-4 w-4" />
                        <span>Digital Wallet</span>
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="stripe" className="space-y-4">
                      {clientSecret && (
                        <Elements
                          stripe={stripePromise}
                          options={{
                            clientSecret,
                            appearance: {
                              theme: 'stripe',
                              variables: {
                                colorPrimary: '#0070f3',
                                colorBackground: '#ffffff',
                                colorText: '#1a1a1a',
                                colorDanger: '#df1b41',
                                fontFamily: 'system-ui, sans-serif',
                                spacingUnit: '4px',
                                borderRadius: '4px',
                              },
                            },
                          }}
                        >
                          <StripePaymentForm
                            total={summary.total}
                            onSuccess={handleSuccessfulPayment}
                            onError={(message, details) => {
                              setPaymentError(message);
                              setPaymentErrorDetails(details || null);
                              toast.error(message);
                              setIsProcessing(false);
                            }}
                          />
                        </Elements>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="paypal" className="space-y-4">
                      <div className="rounded-md border p-6">
                        <div className="w-full max-w-md mx-auto">
                          <div className="flex justify-center mb-6">
                            <Image 
                              src="/images/paypal-logo-large.svg" 
                              alt="PayPal" 
                              width={180} 
                              height={50} 
                              className="h-12 w-auto" 
                            />
                          </div>
                          
                          <p className="text-center text-sm text-muted-foreground mb-6">
                            Click the PayPal button below to complete your purchase securely.
                          </p>
                          
                          <PayPalScriptProvider options={{ 
                            currency: "EUR",
                            clientId: PAYPAL_CLIENT_ID,
                            intent: "capture",
                            components: "buttons,funding-eligibility"
                          }}>
                            <PayPalButtons 
                              style={{ 
                                layout: "vertical",
                                shape: "rect",
                                label: "pay"
                              }}
                              disabled={isProcessing}
                              fundingSource={undefined}
                              createOrder={(data, actions) => {
                                if (!shippingAddress) {
                                  router.replace("/checkout");
                                  throw new Error("Shipping address is missing");
                                }
                                
                                // Convert country name to ISO 3166-1 alpha-2 format
                                const countryCodeMap: Record<string, string> = {
                                  'AFGHANISTAN': 'AF',
                                  'ALBANIA': 'AL',
                                  'ALGERIA': 'DZ',
                                  'ANDORRA': 'AD',
                                  'ANGOLA': 'AO',
                                  'ARGENTINA': 'AR',
                                  'ARMENIA': 'AM',
                                  'AUSTRALIA': 'AU',
                                  'AUSTRIA': 'AT',
                                  'AZERBAIJAN': 'AZ',
                                  'BAHAMAS': 'BS',
                                  'BAHRAIN': 'BH',
                                  'BANGLADESH': 'BD',
                                  'BARBADOS': 'BB',
                                  'BELARUS': 'BY',
                                  'BELGIUM': 'BE',
                                  'BELIZE': 'BZ',
                                  'BENIN': 'BJ',
                                  'BHUTAN': 'BT',
                                  'BOLIVIA': 'BO',
                                  'BOSNIA': 'BA',
                                  'BOSNIA AND HERZEGOVINA': 'BA',
                                  'BOTSWANA': 'BW',
                                  'BRAZIL': 'BR',
                                  'BRUNEI': 'BN',
                                  'BULGARIA': 'BG',
                                  'BURKINA FASO': 'BF',
                                  'BURUNDI': 'BI',
                                  'CAMBODIA': 'KH',
                                  'CAMEROON': 'CM',
                                  'CANADA': 'CA',
                                  'CAPE VERDE': 'CV',
                                  'CENTRAL AFRICAN REPUBLIC': 'CF',
                                  'CHAD': 'TD',
                                  'CHILE': 'CL',
                                  'CHINA': 'CN',
                                  'COLOMBIA': 'CO',
                                  'COMOROS': 'KM',
                                  'CONGO': 'CG',
                                  'COSTA RICA': 'CR',
                                  'CROATIA': 'HR',
                                  'CUBA': 'CU',
                                  'CYPRUS': 'CY',
                                  'CZECH REPUBLIC': 'CZ',
                                  'DENMARK': 'DK',
                                  'DJIBOUTI': 'DJ',
                                  'DOMINICA': 'DM',
                                  'DOMINICAN REPUBLIC': 'DO',
                                  'EAST TIMOR': 'TL',
                                  'ECUADOR': 'EC',
                                  'EGYPT': 'EG',
                                  'EL SALVADOR': 'SV',
                                  'EQUATORIAL GUINEA': 'GQ',
                                  'ERITREA': 'ER',
                                  'ESTONIA': 'EE',
                                  'ETHIOPIA': 'ET',
                                  'FIJI': 'FJ',
                                  'FINLAND': 'FI',
                                  'FRANCE': 'FR',
                                  'GABON': 'GA',
                                  'GAMBIA': 'GM',
                                  'GEORGIA': 'GE',
                                  'GERMANY': 'DE',
                                  'GHANA': 'GH',
                                  'GREECE': 'GR',
                                  'GRENADA': 'GD',
                                  'GUATEMALA': 'GT',
                                  'GUINEA': 'GN',
                                  'GUINEA-BISSAU': 'GW',
                                  'GUYANA': 'GY',
                                  'HAITI': 'HT',
                                  'HONDURAS': 'HN',
                                  'HUNGARY': 'HU',
                                  'ICELAND': 'IS',
                                  'INDIA': 'IN',
                                  'INDONESIA': 'ID',
                                  'IRAN': 'IR',
                                  'IRAQ': 'IQ',
                                  'IRELAND': 'IE',
                                  'ISRAEL': 'IL',
                                  'ITALY': 'IT',
                                  'IVORY COAST': 'CI',
                                  'JAMAICA': 'JM',
                                  'JAPAN': 'JP',
                                  'JORDAN': 'JO',
                                  'KAZAKHSTAN': 'KZ',
                                  'KENYA': 'KE',
                                  'KIRIBATI': 'KI',
                                  'NORTH KOREA': 'KP',
                                  'SOUTH KOREA': 'KR',
                                  'KOSOVO': 'XK',
                                  'KUWAIT': 'KW',
                                  'KYRGYZSTAN': 'KG',
                                  'LAOS': 'LA',
                                  'LATVIA': 'LV',
                                  'LEBANON': 'LB',
                                  'LESOTHO': 'LS',
                                  'LIBERIA': 'LR',
                                  'LIBYA': 'LY',
                                  'LIECHTENSTEIN': 'LI',
                                  'LITHUANIA': 'LT',
                                  'LUXEMBOURG': 'LU',
                                  'MACEDONIA': 'MK',
                                  'MADAGASCAR': 'MG',
                                  'MALAWI': 'MW',
                                  'MALAYSIA': 'MY',
                                  'MALDIVES': 'MV',
                                  'MALI': 'ML',
                                  'MALTA': 'MT',
                                  'MARSHALL ISLANDS': 'MH',
                                  'MAURITANIA': 'MR',
                                  'MAURITIUS': 'MU',
                                  'MEXICO': 'MX',
                                  'MICRONESIA': 'FM',
                                  'MOLDOVA': 'MD',
                                  'MONACO': 'MC',
                                  'MONGOLIA': 'MN',
                                  'MONTENEGRO': 'ME',
                                  'MOROCCO': 'MA',
                                  'MOZAMBIQUE': 'MZ',
                                  'MYANMAR': 'MM',
                                  'NAMIBIA': 'NA',
                                  'NAURU': 'NR',
                                  'NEPAL': 'NP',
                                  'NETHERLANDS': 'NL',
                                  'NEW ZEALAND': 'NZ',
                                  'NICARAGUA': 'NI',
                                  'NIGER': 'NE',
                                  'NIGERIA': 'NG',
                                  'NORWAY': 'NO',
                                  'OMAN': 'OM',
                                  'PAKISTAN': 'PK',
                                  'PALAU': 'PW',
                                  'PANAMA': 'PA',
                                  'PAPUA NEW GUINEA': 'PG',
                                  'PARAGUAY': 'PY',
                                  'PERU': 'PE',
                                  'PHILIPPINES': 'PH',
                                  'POLAND': 'PL',
                                  'PORTUGAL': 'PT',
                                  'QATAR': 'QA',
                                  'ROMANIA': 'RO',
                                  'RUSSIA': 'RU',
                                  'RWANDA': 'RW',
                                  'SAINT KITTS AND NEVIS': 'KN',
                                  'SAINT LUCIA': 'LC',
                                  'SAINT VINCENT AND THE GRENADINES': 'VC',
                                  'SAMOA': 'WS',
                                  'SAN MARINO': 'SM',
                                  'SAO TOME AND PRINCIPE': 'ST',
                                  'SAUDI ARABIA': 'SA',
                                  'SENEGAL': 'SN',
                                  'SERBIA': 'RS',
                                  'SEYCHELLES': 'SC',
                                  'SIERRA LEONE': 'SL',
                                  'SINGAPORE': 'SG',
                                  'SLOVAKIA': 'SK',
                                  'SLOVENIA': 'SI',
                                  'SOLOMON ISLANDS': 'SB',
                                  'SOMALIA': 'SO',
                                  'SOUTH AFRICA': 'ZA',
                                  'SPAIN': 'ES',
                                  'SRI LANKA': 'LK',
                                  'SUDAN': 'SD',
                                  'SURINAME': 'SR',
                                  'SWAZILAND': 'SZ',
                                  'SWEDEN': 'SE',
                                  'SWITZERLAND': 'CH',
                                  'SYRIA': 'SY',
                                  'TAIWAN': 'TW',
                                  'TAJIKISTAN': 'TJ',
                                  'TANZANIA': 'TZ',
                                  'THAILAND': 'TH',
                                  'TOGO': 'TG',
                                  'TONGA': 'TO',
                                  'TRINIDAD AND TOBAGO': 'TT',
                                  'TUNISIA': 'TN',
                                  'TURKEY': 'TR',
                                  'TURKMENISTAN': 'TM',
                                  'TUVALU': 'TV',
                                  'UGANDA': 'UG',
                                  'UKRAINE': 'UA',
                                  'UNITED ARAB EMIRATES': 'AE',
                                  'UNITED KINGDOM': 'GB',
                                  'UNITED STATES': 'US',
                                  'URUGUAY': 'UY',
                                  'UZBEKISTAN': 'UZ',
                                  'VANUATU': 'VU',
                                  'VATICAN CITY': 'VA',
                                  'VENEZUELA': 'VE',
                                  'VIETNAM': 'VN',
                                  'YEMEN': 'YE',
                                  'ZAMBIA': 'ZM',
                                  'ZIMBABWE': 'ZW'
                                };

                                // Get the country code from the map, or fallback to the original if not found
                                const countryName = shippingAddress.country.toUpperCase();
                                const countryCode = countryCodeMap[countryName] || shippingAddress.country;
                                
                                return actions.order.create({
                                  intent: "CAPTURE",
                                  purchase_units: [
                                    {
                                      amount: {
                                        value: summary.total.toFixed(2),
                                        currency_code: "EUR",
                                        breakdown: {
                                          item_total: {
                                            value: summary.subtotal.toFixed(2),
                                            currency_code: "EUR"
                                          },
                                          shipping: {
                                            value: summary.shipping.toFixed(2),
                                            currency_code: "EUR"
                                          },
                                          tax_total: {
                                            value: summary.tax.toFixed(2),
                                            currency_code: "EUR"
                                          },
                                          discount: {
                                            value: summary.discount.toFixed(2),
                                            currency_code: "EUR"
                                          }
                                        }
                                      },
                                      items: items.map(item => ({
                                        name: item.name,
                                        quantity: String(item.quantity),
                                        unit_amount: {
                                          value: item.price.toFixed(2),
                                          currency_code: "EUR"
                                        }
                                      })),
                                      shipping: {
                                        name: {
                                          full_name: `${shippingAddress.firstName} ${shippingAddress.lastName}`
                                        },
                                        address: {
                                          address_line_1: shippingAddress.addressLine1,
                                          address_line_2: shippingAddress.addressLine2 || '',
                                          admin_area_2: shippingAddress.city,
                                          admin_area_1: shippingAddress.state,
                                          postal_code: shippingAddress.postalCode,
                                          country_code: countryCode  // Use the converted country code here
                                        }
                                      }
                                    }
                                  ]
                                });
                              }}
                              onApprove={(data, actions) => {
                                if (!actions.order) {
                                  return Promise.resolve();
                                }
                                return actions.order.capture().then((details) => {
                                  handlePayPalPayment(data);
                                });
                              }}
                              onError={(err) => {
                                console.error('PayPal error:', err);
                                setPaymentError('An error occurred with PayPal. Please try again.');
                                toast.error('An error occurred with PayPal. Please try again.');
                              }}
                            />
                          </PayPalScriptProvider>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="wallet" className="space-y-4">
                      <div className="rounded-md border p-6">
                        <div className="w-full max-w-md mx-auto">
                          <div className="text-center mb-4">
                            <h3 className="text-lg font-medium">Digital Wallet Payment</h3>
                            <p className="text-sm text-muted-foreground">
                              Pay securely using your digital wallet
                            </p>
                          </div>
                          
                          <div className="space-y-4">
                            <Button 
                              variant="outline" 
                              className="w-full h-14 justify-start gap-4"
                              onClick={() => {
                                toast.info("Apple Pay is currently being set up. Please use another payment method.");
                              }}
                            >
                              <AppleIcon className="h-6 w-6" />
                              <span className="font-medium">Apple Pay</span>
                            </Button>
                            
                              <Button 
                                variant="outline" 
                                className="w-full h-14 justify-start gap-4"
                                onClick={() => {
                                  toast.info("Google Pay is currently being set up. Please use another payment method.");
                                }}
                              >
                                <Image 
                                  src="/images/google-pay-logo.svg" 
                                  alt="Google Pay" 
                                  width={60} 
                                  height={24} 
                                  className="h-6 w-auto"
                                />
                              </Button>
                              
                              <p className="text-xs text-center text-muted-foreground mt-6">
                                Digital wallet payments provide a fast, secure checkout experience.
                                To use them, you need to have them set up on your device.
                              </p>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                  </Tabs>
                )}
                
                {paymentError && (
                  <Alert variant="destructive" className="mt-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Payment Error</AlertTitle>
                    <AlertDescription>
                          <div className="space-y-2">
                            {paymentErrorDetails && (
                              <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="details">
                                  <AccordionTrigger className="text-sm">
                                    Technical Details
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="text-xs space-y-1">
                                      <p><strong>Error Code:</strong> {paymentErrorDetails.code}</p>
                                      {paymentErrorDetails.technical && (
                                        <p><strong>Type:</strong> {paymentErrorDetails.technical}</p>
                                      )}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            )}
                          </div>
                        </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              
              <CardFooter className="flex flex-col gap-4">
                <Separator />
                <div className="flex justify-between w-full">
                  <Button
                    variant="outline"
                    onClick={() => setIsOrderReviewed(false)}
                    disabled={isProcessing || isLoading}
                  >
                    Back to Review
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )}
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Review your order before completing your purchase
              </p>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${formatPrice(summary.subtotal)}</span>
                </div>
              
                {summary.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${formatPrice(summary.discount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>${formatPrice(summary.shipping)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${formatPrice(summary.tax)}</span>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${formatPrice(summary.total)}</span>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-3">
                <div>
                  {shippingAddress && (
                    <div className="text-sm text-muted-foreground mt-1">
                      <p>{shippingAddress.firstName} {shippingAddress.lastName}</p>
                      <p>{shippingAddress.addressLine1}</p>
                      {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
                      <p>
                        {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
                      </p>
                      <p>{shippingAddress.country}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium">Shipping Method</h4>
                  {selectedShippingOption && (
                    <div className="text-sm text-muted-foreground mt-1">
                      <p>{selectedShippingOption.name}</p>
                      <p>{selectedShippingOption.estimatedDelivery}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6 space-y-4">
                <h4 className="font-medium">Order Items</h4>
                
                <div className="max-h-56 overflow-y-auto space-y-2 border rounded-md p-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground"> × {item.quantity}</span>
                      </div>
                      <span>${formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 space-y-4">
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  <p className="font-medium text-foreground">Secure Payment</p>
                  <p className="mt-1">Your payment and personal information are secure through SSL encryption.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}