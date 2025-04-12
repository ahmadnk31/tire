"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCart, ShippingAddress } from "@/contexts/cart-context";
import { validateShippingAddress, getShippingRates } from "@/lib/shipping/shipping-client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronRight, 
  ArrowLeft, 
  Package, 
  Truck, 
  CreditCard, 
  ShieldCheck 
} from "lucide-react";
import Link from "next/link";

// Form validation schema
const formSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters" }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(10, { message: "Please enter a valid phone number" }),
  addressLine1: z.string().min(5, { message: "Address is required" }),
  addressLine2: z.string().optional(),
  city: z.string().min(2, { message: "City is required" }),
  state: z.string().min(2, { message: "State is required" }),
  postalCode: z.string().min(4, { message: "Postal code is required" }),
  country: z.string().min(2, { message: "Country is required" }),
  shippingOption: z.string({ required_error: "Please select a shipping option" }),
});

export default function CheckoutPage() {
  const router = useRouter();
  const { 
    items, 
    shippingAddress, 
    setShippingAddress, 
    shippingOptions, 
    setShippingOptions, 
    setSelectedShippingOption, 
    summary, 
    updateSummary 
  } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [addressFeedback, setAddressFeedback] = useState<{
    hasIssues: boolean;
    suggestedAddress?: ShippingAddress;
    messages: string[];
  } | null>(null);

  // Initialize the form with default values from cart context if available
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: shippingAddress?.firstName || "",
      lastName: shippingAddress?.lastName || "",
      email: shippingAddress?.email || "",
      phone: shippingAddress?.phone || "",
      addressLine1: shippingAddress?.addressLine1 || "",
      addressLine2: shippingAddress?.addressLine2 || "",
      city: shippingAddress?.city || "",
      state: shippingAddress?.state || "",
      postalCode: shippingAddress?.postalCode || "",
      country: shippingAddress?.country || "BELGIUM",
      shippingOption: "",
    },
  });

  // Redirect to cart if there are no items
  useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart");
    }
  }, [items, router]);

  // Function to validate shipping address and fetch shipping rates
  const validateAndFetchRates = async (formValues: z.infer<typeof formSchema>) => {
    setIsValidatingAddress(true);
    setAddressFeedback(null);
    
    // Create address object from form values
    const address: ShippingAddress = {
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      email: formValues.email,
      phone: formValues.phone,
      addressLine1: formValues.addressLine1,
      addressLine2: formValues.addressLine2,
      city: formValues.city,
      state: formValues.state,
      postalCode: formValues.postalCode,
      country: formValues.country,
    };
    
    try {
      // Validate the address with DHL
      const validationResult = await validateShippingAddress(address);
      
      if (!validationResult.isValid) {
        // Show address suggestion or error
        setAddressFeedback({
          hasIssues: true,
          suggestedAddress: validationResult.suggestedAddress || undefined,
          messages: validationResult.messages
        });
      }
      
      // Even if there are address issues, try to get shipping rates
      // For addresses with minor issues, DHL might still provide shipping rates
      
      // For demo purposes, use a fixed store address as the shipping origin
      const storeAddress: ShippingAddress = {
        firstName: "Store",
        lastName: "Admin",
        email: "store@example.com",
        phone: "1234567890",
        addressLine1: "123 Main St",
        addressLine2: "",
        city: "Brussels",
        state: "BE",
        postalCode: "1000",
        country: "BELGIUM",
      };
      
      // Get dynamic shipping rates from DHL
      const shippingRates = await getShippingRates(storeAddress, address, items);
      
      // Update shipping options in cart context
      if (shippingRates.length > 0) {
        setShippingOptions(shippingRates);
        
        // Pre-select the first shipping option
        form.setValue("shippingOption", shippingRates[0].id);
        
        // Update the cart summary with the new shipping cost
        updateSummary(shippingRates[0].price);
      }
    } catch (error) {
      console.error("Error validating address or getting rates:", error);
      setAddressFeedback({
        hasIssues: true,
        messages: [(error as Error).message || "Failed to validate address and get shipping rates"]
      });
    } finally {
      setIsValidatingAddress(false);
    }
  };
  
  // Use effect to run address validation when address fields are filled
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      // Only run validation when address fields are changed and all required fields are filled
      const addressFields = ["addressLine1", "city", "state", "postalCode", "country"];
      
      if (addressFields.includes(name as string)) {
        const formValues = form.getValues();
        const allAddressFieldsFilled = addressFields.every(field => 
          Boolean(formValues[field as keyof typeof formValues])
        );
        
        if (allAddressFieldsFilled) {
          // Use debounce to avoid too many API calls
          const timeoutId = setTimeout(() => {
            validateAndFetchRates(formValues);
          }, 1000);
          
          return () => clearTimeout(timeoutId);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  // Format price to display with 2 decimal places
  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    // Create shipping address object
    const address: ShippingAddress = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
      addressLine1: values.addressLine1,
      addressLine2: values.addressLine2,
      city: values.city,
      state: values.state,
      postalCode: values.postalCode,
      country: values.country,
    };
    
    // Find selected shipping option
    const selectedOption = shippingOptions.find(option => option.id === values.shippingOption);
    
    if (selectedOption) {
      // Save shipping address and selected shipping option to cart context
      setShippingAddress(address);
      setSelectedShippingOption(selectedOption);
      
      // Navigate to payment page
      setTimeout(() => {
        router.push("/checkout/payment");
      }, 500);
    } else {
      form.setError("shippingOption", {
        type: "manual",
        message: "Please select a valid shipping option",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-7xl py-12">
      <div className="mb-8">
        <Link 
          href="/cart" 
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cart
        </Link>
        <h1 className="text-3xl font-bold mt-2">Checkout</h1>
      </div>
      
      <div className="flex mb-8 border-b pb-4">
        <div className="flex items-center text-primary">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-primary text-xs font-bold text-white">
            1
          </div>
          <span className="ml-2 font-medium">Shipping</span>
        </div>
        <div className="mx-4 flex items-center">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center text-muted-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted text-xs font-medium">
            2
          </div>
          <span className="ml-2 font-medium">Payment</span>
        </div>
        <div className="mx-4 flex items-center">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center text-muted-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted text-xs font-medium">
            3
          </div>
          <span className="ml-2 font-medium">Confirmation</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Shipping Information</h2>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="First name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Email address" {...field} />
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
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="Phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="addressLine1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 1</FormLabel>
                        <FormControl>
                          <Input placeholder="Street address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="addressLine2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 2 (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Apartment, suite, unit, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State/Province</FormLabel>
                          <FormControl>
                            <Input placeholder="State or province" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP/Postal Code</FormLabel>
                          <FormControl>
                            <Input placeholder="ZIP or postal code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="Country" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Shipping Method</h2>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="shippingOption"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="space-y-3"
                          >
                            {shippingOptions.map((option) => (
                              <div
                                key={option.id}
                                className={`flex items-start space-x-3 rounded-md border p-4 ${
                                  field.value === option.id ? "border-primary bg-primary/5" : ""
                                }`}
                              >
                                <FormControl>
                                  <RadioGroupItem value={option.id} />
                                </FormControl>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium">{option.name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {option.estimatedDelivery}
                                      </p>
                                    </div>
                                    <p className="font-medium">${formatPrice(option.price)}</p>
                                  </div>
                                  {option.description && (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                      {option.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/cart")}
                  >
                    Back to Cart
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="min-w-32"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Continue to Payment</span>
                      </div>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </div>
        
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {items.length} {items.length === 1 ? "item" : "items"} in your cart
              </p>
              
              <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-3 mb-4">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground"> × {item.quantity}</span>
                    </div>
                    <span>${formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              
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
                  <span className="text-muted-foreground">Tax</span>
                  <span>${formatPrice(summary.tax)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>${formatPrice(summary.shipping)}</span>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${formatPrice(summary.total)}</span>
              </div>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-center text-sm">
                  <ShieldCheck className="h-4 w-4 mr-2 text-green-600" />
                  <span>Secure Checkout</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}