"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { defaultShippingOptions, useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
  SmartphoneIcon,
  ChevronRight,
  PackageIcon,
  UserIcon,
  ShoppingBag,
  CheckCircle2
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
import { ShippingOption } from "@/contexts/cart-context";
import { loadStripe } from "@stripe/stripe-js";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { DEFAULT_SHIPPING_OPTIONS, convertPricesToCents } from "@/lib/shipping/shipping-options";
import { useTranslations } from 'next-intl';
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { ShippingService } from '@/lib/shipping/shipping-service';
import { formatPrice } from "@/lib/utils";

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

// Steps for the multi-step payment process
enum PaymentStep {
  REVIEW = 'review',
  PAYMENT = 'payment',
  CONFIRMATION = 'confirmation'
}

// Interface for collected user data during the payment process
interface PaymentUserData {
  email: string;
  name?: string;
  phone?: string;
  shippingAddress?: any;
  billingAddress?: any;
  shippingOption?: ShippingOption;
  receiveMarketingEmails?: boolean;
  savePaymentMethod?: boolean;
  notes?: string;
}

// Stripe Payment Form Component
function StripePaymentForm({ 
  total, 
  onSuccess, 
  onError,
  userData,
  onUserDataChange,
  handleShippingOptionChange
}: { 
  total: number; 
  onSuccess: () => void; 
  onError: (message: string, details?: PaymentErrorDetails) => void;
  userData: PaymentUserData;
  onUserDataChange: (data: Partial<PaymentUserData>) => void;
  handleShippingOptionChange: (option: ShippingOption) => void;
}){
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [email, setEmail] = useState('');
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);
  const [collectedAddress, setCollectedAddress] = useState<any>(null);
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
        requestShipping: true,
        shippingOptions: convertPricesToCents(DEFAULT_SHIPPING_OPTIONS),
      });
      
      // Check if payment request can be used
      pr.canMakePayment().then(result => {
        if (result) {
          setPaymentRequest(pr);
          setCanMakePayment(true);
        }
      });
      
      // Handle shipping address change
      pr.on('shippingaddresschange', (e) => {
        // Store the shipping address
        if (e.shippingAddress) {
          setCollectedAddress(e.shippingAddress);
        }
        e.updateWith({ status: 'success' });
      });
      
      // Handle payment request success
      pr.on('paymentmethod', async (e) => {
        setIsProcessing(true);
        
        try {
          if (!elements) {
            throw new Error('Stripe Elements not initialized');
          }
          
          // Store shipping details if available
          if (e.shippingAddress || e.payerName || e.payerEmail || e.payerPhone) {
            // Combine shipping and payment details
            const collectedInfo = {
              name: e.payerName,
              email: e.payerEmail,
              phone: e.payerPhone,
              address: e.shippingAddress
            };
            setCollectedAddress(collectedInfo);
          }
            const {error: confirmError} = await stripe.confirmPayment({
            elements,
            confirmParams: {
              return_url: `${window.location.origin}/checkout/confirmation`,
              payment_method: e.paymentMethod.id,
              receipt_email: e.payerEmail || email,
              shipping: e.shippingAddress ? {
                name: e.shippingAddress.recipient || e.payerName || '',
                phone: e.shippingAddress.phone || e.payerPhone || '',
                address: {
                  line1: e.shippingAddress.addressLine && e.shippingAddress.addressLine[0] ? e.shippingAddress.addressLine[0] : '',
                  line2: e.shippingAddress.addressLine && e.shippingAddress.addressLine[1] ? e.shippingAddress.addressLine[1] : '',
                  city: e.shippingAddress.city || '',
                  state: e.shippingAddress.region || '',
                  postal_code: e.shippingAddress.postalCode || '',
                  country: e.shippingAddress.country || '',
                }
              } : undefined
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
      // Collect address information if provided via the Address Element
      let addressData = null;
      const addressElement = elements.getElement('address');
      if (addressElement) {
        const { complete, value } = await addressElement.getValue();
        
        if (complete) {
          addressData = value;
          // Store the address data for future reference
          setCollectedAddress(addressData);
        }
      }
      
      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/confirmation`,
          receipt_email: email,
          save_payment_method: savePaymentMethod,
          shipping: addressData ? {
            name: addressData.name,
            address: {
              line1: addressData.address.line1,
              line2: addressData.address.line2 === null ? undefined : addressData.address.line2,
              city: addressData.address.city,
              state: addressData.address.state,
              postal_code: addressData.address.postal_code,
              country: addressData.address.country,
            },
            phone: addressData.phone,
          } : undefined
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
        <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Shipping Address</h3>
          <AddressElement 
            options={{
              mode: 'shipping',
              fields: {
                phone: 'always',
              },
              validation: {
                phone: {
                  required: 'always',
                },
              },
              defaultValues: {
                name: '',
                address: {
                  line1: '',
                  line2: '',
                  city: '',
                  state: '',
                  postal_code: '',
                  country: 'BE',
                },
                phone: '',
              },
            }}
            onChange={(event) => {
              if (event.complete) {
                // Address is complete and valid
                setCollectedAddress(event.value);
              }
            }}
          />
        </div>
          <div>
          <h3 className="text-sm font-medium mb-2">Shipping Options</h3>
            <div className="space-y-2 border rounded-md p-3">            
              {defaultShippingOptions && defaultShippingOptions.length > 0 ? (
              defaultShippingOptions.map((option) => (
                <div 
                  key={option.id} 
                  className={`flex items-center justify-between p-3 rounded-md cursor-pointer border ${
                    collectedAddress && collectedAddress.shippingOption === option.id ? 'border-primary bg-primary/5' : 'border-muted'
                  } hover:border-primary hover:bg-primary/5 transition-all`}
                  onClick={() => {
                    setCollectedAddress((prev: any) => ({
                      ...prev,
                      shippingOption: option.id
                    }));
                    // Update shipping option in cart context
                    handleShippingOptionChange(option);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border ${
                      collectedAddress && collectedAddress.shippingOption === option.id ? 'border-4 border-primary' : 'border border-muted-foreground'
                    }`} />
                    <div>
                      <div className="font-medium">{option.name}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                      <div className="text-xs text-muted-foreground">{option.estimatedDelivery}</div>
                    </div>
                  </div>
                  <div className="font-medium">{formatPrice(option.price)}</div>
                </div>
              ))            ) : (
              // Fallback options if API call fails - use standardized shipping options
              DEFAULT_SHIPPING_OPTIONS.map((option) => (
                <div 
                  key={option.id} 
                  className={`flex items-center justify-between p-3 rounded-md cursor-pointer border ${
                    collectedAddress && collectedAddress.shippingOption === option.id ? 'border-primary bg-primary/5' : 'border-muted'
                  } hover:border-primary hover:bg-primary/5 transition-all`}
                  onClick={() => {
                    setCollectedAddress((prev: any) => ({
                      ...prev,
                      shippingOption: option.id
                    }));
                    // Update shipping option in cart context with fallback option
                    handleShippingOptionChange({
                      id: option.id,
                      name: option.name,
                      price: option.price,
                      description: option.description,
                      estimatedDelivery: option.estimatedDelivery
                    });
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border ${
                      collectedAddress && collectedAddress.shippingOption === option.id ? 'border-4 border-primary' : 'border border-muted-foreground'
                    }`} />
                    <div>
                      <div className="font-medium">{option.name}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                      <div className="text-xs text-muted-foreground">{option.estimatedDelivery}</div>
                    </div>
                  </div>
                  <div className="font-medium">
                    {formatPrice(option.price)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">Payment Details</h3>
          <PaymentElement />
        </div>
      </div>
      
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
          <span>Pay {formatPrice(total)}</span>
        )}
      </Button>
    </form>
  );
}

export default function PaymentPage() {
  const t = useTranslations('Checkout');
  const router = useRouter();
  const { 
    items, 
    summary, 
    shippingAddress, 
    selectedShippingOption,
    setSelectedShippingOption,
    clearCart,
    updateSummary
  } = useCart();
  
  // Current step in the payment process
  const [currentStep, setCurrentStep] = useState<PaymentStep>(PaymentStep.REVIEW);
  
  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal" | "wallet">("stripe");
  
  // Processing and error states
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentErrorDetails, setPaymentErrorDetails] = useState<PaymentErrorDetails | null>(null);
  
  // Stripe payment states
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [paymentProgress, setPaymentProgress] = useState(0);
  
  // Shipping options
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
    // User data collected during payment process
  const [userData, setUserData] = useState<PaymentUserData>({
    email: shippingAddress?.email || '',
    name: shippingAddress ? `${shippingAddress.firstName} ${shippingAddress.lastName}` : '',
    phone: shippingAddress?.phone || '',
    shippingAddress: null,
    receiveMarketingEmails: false,
    savePaymentMethod: false,
    notes: ''
  });
  
  // Handle shipping option change - memoized with useCallback
  const handleShippingOptionChange = useCallback((option: ShippingOption) => {
    // Set the selected shipping option in the cart context
    setSelectedShippingOption(option);
    
    // Update the summary with the new shipping cost
    const newShippingCost = option.price;
    updateSummary(summary.subtotal + newShippingCost + summary.tax - summary.discount);
  }, [setSelectedShippingOption, updateSummary, summary]);

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
      }      const response = await fetch('/api/orders/create', {
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
          // Include additional user data collected during checkout
          userData: {
            notes: userData.notes || '',
            receiveMarketingEmails: userData.receiveMarketingEmails || false,
            savePaymentMethod: userData.savePaymentMethod || false
          },
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
  };  // Handle updating user data fields
  const updateUserData = (data: Partial<PaymentUserData>) => {
    setUserData(prev => ({...prev, ...data}));
  };

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
    <div className="container max-w-7xl py-12 space-y-8">
      <div className="mb-8">
        <Link 
          href="/checkout" 
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backToShipping')}
        </Link>
        <h1 className="text-3xl font-bold mt-2">{t('payment')}</h1>
      </div>
      
      {/* Step indicator */}
      <div className="flex mb-8 border-b pb-4">
        <div className="flex items-center text-muted-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted text-xs font-medium">
            1
          </div>
          <span className="ml-2 font-medium">{t('shipping')}</span>
        </div>
        <div className="mx-4 flex items-center">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className={`flex items-center ${currentStep === PaymentStep.REVIEW ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${currentStep === PaymentStep.REVIEW ? 'border-primary bg-primary text-white' : 'border-muted'} text-xs font-bold`}>
            2
          </div>
          <span className="ml-2 font-medium">{t('review')}</span>
        </div>
        <div className="mx-4 flex items-center">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className={`flex items-center ${currentStep === PaymentStep.PAYMENT ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${currentStep === PaymentStep.PAYMENT ? 'border-primary bg-primary text-white' : 'border-muted'} text-xs font-medium`}>
            3
          </div>
          <span className="ml-2 font-medium">{t('payment')}</span>
        </div>
        <div className="mx-4 flex items-center">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className={`flex items-center ${currentStep === PaymentStep.CONFIRMATION ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${currentStep === PaymentStep.CONFIRMATION ? 'border-primary bg-primary text-white' : 'border-muted'} text-xs font-medium`}>
            4
          </div>
          <span className="ml-2 font-medium">{t('confirmation')}</span>
        </div>
      </div>
      
      {/* Progress indicator during transition between steps */}
      {isProcessing && (
        <Progress value={paymentProgress} className="h-1 w-full" />
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Content - Main area */}
        <div className="lg:col-span-2">
          {currentStep === PaymentStep.REVIEW && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">{t('reviewOrder')}</h2>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium">{t('orderItems')} ({items.length})</h3>
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
                              {t('quantity')}: {item.quantity}
                            </div>
                          </div>
                          <div className="font-medium">{formatPrice(item.price * item.quantity)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-2">{t('shippingAddress')}</h3>
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
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">{t('shippingMethod')}</h3>
                      {selectedShippingOption && (
                        <div className="text-sm space-y-1">
                          <p className="font-medium">{selectedShippingOption.name}</p>
                          <p>{selectedShippingOption.description}</p>
                          <p>{selectedShippingOption.estimatedDelivery}</p>
                          <p className="font-medium">{formatPrice(selectedShippingOption.price)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="receiveMarketingEmails" 
                      checked={userData.receiveMarketingEmails || false}
                      onCheckedChange={(checked) => 
                        updateUserData({ receiveMarketingEmails: !!checked })
                      }
                    />
                    <label
                      htmlFor="receiveMarketingEmails"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {t('receiveMarketingEmails')}
                    </label>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">{t('orderNotes')}</h3>
                    <textarea 
                      className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      placeholder={t('orderNotesPlaceholder')}
                      value={userData.notes || ''}
                      onChange={(e) => updateUserData({ notes: e.target.value })}
                    ></textarea>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={() => setCurrentStep(PaymentStep.PAYMENT)}
                  className="min-w-32"
                >
                  {t('continueToPayment')} <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {currentStep === PaymentStep.PAYMENT && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <LockIcon className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-semibold">{t('securePayment')}</h2>
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <div className="py-12 space-y-4">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
                      <p className="text-muted-foreground">{t('initializingPayment')}</p>
                    </div>
                    <Progress value={paymentProgress} className="w-full h-2" />
                  </div>
                ) : (
                  <Tabs defaultValue="card" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="card" onClick={() => setPaymentMethod("stripe")}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        {t('creditCard')}
                      </TabsTrigger>
                      <TabsTrigger value="paypal" onClick={() => setPaymentMethod("paypal")}>
                        <Image src="/paypal.svg" alt="PayPal" width={18} height={18} className="mr-2" />
                        PayPal
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="card">
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
                            userData={userData}
                            onUserDataChange={updateUserData}
                            handleShippingOptionChange={handleShippingOptionChange}
                          />
                        </Elements>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="paypal">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-medium mb-2">{t('payWithPayPal')}</h3>
                          <p className="text-sm text-muted-foreground mb-6">
                            {t('payPalDescription')}
                          </p>
                          
                          <div className="w-full">
                            <PayPalScriptProvider options={{ 
                              'client-id': PAYPAL_CLIENT_ID,
                              clientId: PAYPAL_CLIENT_ID,
                              currency: 'EUR',
                              
                            }}>
                              <PayPalButtons 
                                style={{ 
                                  layout: 'vertical',
                                  shape: 'rect',
                                  color: 'blue'
                                }}
                                
                                createOrder={(data, actions) => {
                                  return actions.order.create({
                                    intent: "CAPTURE",
                                    purchase_units: [{
                                      amount: {
                                        value: summary.total.toFixed(2),
                                        currency_code: 'EUR',
                                        breakdown: {
                                          item_total: {
                                            value: summary.subtotal.toFixed(2),
                                            currency_code: 'EUR'
                                          },
                                          shipping: {
                                            value: summary.shipping.toFixed(2),
                                            currency_code: 'EUR'
                                          },
                                          tax_total: {
                                            value: summary.tax.toFixed(2),
                                            currency_code: 'EUR'
                                          },
                                          discount: {
                                            value: summary.discount.toFixed(2),
                                            currency_code: 'EUR'
                                          }
                                        }
                                      },
                                      items: items.map(item => ({
                                        name: item.name,
                                        quantity: item.quantity.toString(),
                                        unit_amount: {
                                          value: item.price.toFixed(2),
                                          currency_code: 'EUR'
                                        }
                                      }))
                                    }]
                                  });
                                }}
                                onApprove={(data, actions) => {
                                  return actions.order!.capture().then((details) => {
                                    handlePayPalPayment(data);
                                  });
                                }}
                                onShippingAddressChange={async (data, actions) => {
                                  // Update shipping address in the UI
                                  const shippingAddress = data.shippingAddress;
                                  if (shippingAddress) {
                                    // Handle name from PayPal shipping address - might come as fullName or separate fields
                                    let firstName = '';
                                    let lastName = '';
                                    
                                    // Try to extract name from recipientName in shippingAddress if available
                                    // Use type assertion since PayPal may include properties not in the TypeScript definition
                                    const recipientName = (shippingAddress as any).recipientName;
                                    if (recipientName) {
                                      const fullName = recipientName || '';
                                      const nameParts = fullName.split(' ');
                                      firstName = nameParts[0] || '';
                                      lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
                                    }
                                    
                                    updateUserData({
                                      shippingAddress: {
                                        firstName: firstName,
                                        lastName: lastName,
                                        addressLine1: (shippingAddress as any).addressLine?.[0] || (shippingAddress as any).address_line_1 || '',
                                        addressLine2: (shippingAddress as any).addressLine?.[1] || (shippingAddress as any).address_line_2 || '',
                                        city: shippingAddress.city || '',
                                        state: shippingAddress.state || '',
                                        postalCode: shippingAddress.postalCode || '',
                                        country: shippingAddress.countryCode || ''
                                      }
                                    });
                                  }
                                }}
                                onError={(err) => {
                                  console.error('PayPal error:', err);
                                  setPaymentError('An error occurred with PayPal. Please try again or use a different payment method.');
                                  toast.error('PayPal error: Please try again or use a different payment method');
                                }}
                              />
                              
                            </PayPalScriptProvider>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
                
                {paymentError && (
                  <Alert variant="destructive" className="mt-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t('paymentError')}</AlertTitle>
                    <AlertDescription>
                      {paymentError}
                      <div className="mt-2">
                        {paymentErrorDetails && (
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="details">
                              <AccordionTrigger className="text-sm">
                                {t('technicalDetails')}
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="text-xs space-y-1">
                                  <p><strong>{t('errorCode')}:</strong> {paymentErrorDetails.code}</p>
                                  {paymentErrorDetails.technical && (
                                    <p><strong>{t('type')}:</strong> {paymentErrorDetails.technical}</p>
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
                
                <div className="mt-8 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">{t('paymentMethodsAccepted')}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-3">
                    <Image src="/amex.svg" alt="American Express" width={40} height={25} />
                    <Image src="/visa.svg" alt="Visa" width={40} height={25} />
                    <Image src="/mastercard.svg" alt="Mastercard" width={40} height={25} />
                    <Image src="/paypal.svg" alt="PayPal" width={50} height={25} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('securePaymentNote')}
                  </p>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(PaymentStep.REVIEW)}
                  disabled={isProcessing}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> {t('backToReview')}
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {currentStep === PaymentStep.CONFIRMATION && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-semibold">{t('orderConfirmation')}</h2>
              </CardHeader>
              
              <CardContent className="text-center py-12">
                <div className="flex justify-center mb-6">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold mb-2">{t('thankYouForOrder')}</h3>
                <p className="text-muted-foreground mb-6">{t('orderConfirmationMessage')}</p>
                
                <div className="flex justify-center">
                  <Button asChild>
                    <Link href="/checkout/confirmation">
                      {t('viewOrderDetails')}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Order Summary - Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>{t('orderSummary')}</CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('subtotal')}</span>
                  <span>{formatPrice(summary.subtotal)}</span>
                </div>
                
                {summary.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{t('discount')}</span>
                    <span>-{formatPrice(summary.discount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('shipping')}</span>
                  <span>{formatPrice(summary.shipping)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('tax')}</span>
                  <span>{formatPrice(summary.tax)}</span>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-between text-lg font-semibold">
                <span>{t('total')}</span>
                <span>{formatPrice(summary.total)}</span>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <h4 className="font-medium">{t('orderItems')}</h4>
                
                <div className="max-h-56 overflow-y-auto space-y-2 border rounded-md p-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground"> × {item.quantity}</span>
                      </div>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <span>{t('secureCheckout')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}