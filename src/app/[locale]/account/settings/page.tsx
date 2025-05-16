"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useUserProfile, useUpdateUserProfile, useUpdateUserAvatar, 
  useUpdateNotificationPreferences, usePaymentMethods, useDeletePaymentMethod, 
  useSetDefaultPaymentMethod, useUpdatePassword, useRetailerProfile, useUpdateRetailerProfile,
  useAddPaymentMethod } from "@/hooks/use-user-queries";
import { Skeleton } from "@/components/ui/skeleton";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { FileUpload } from "@/components/file-upload";

import { AddressesTab } from "./addresses-tab";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Form schemas
const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  preferredLanguage: z.enum(["en", "nl"]).optional(),
});

const notificationsFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  orderUpdates: z.boolean().default(true),
  promotionalEmails: z.boolean().default(false),
  inventoryAlerts: z.boolean().default(true),
  priceChanges: z.boolean().default(false),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string().min(8, { message: "Please confirm your password" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],

});

const retailerProfileFormSchema = z.object({
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters." }),
  phone: z.string().min(5, { message: "Phone number is required." }),
  businessAddress: z.string().min(5, { message: "Business address is required." }),
  taxId: z.string().optional(),
  yearsInBusiness: z.string().min(1, { message: "Years in business is required." }),
});

const billingInfoSchema = z.object({
  billingName: z.string().min(2, { message: "Name is required" }),
  billingEmail: z.string().email({ message: "Valid email is required" }),
  billingAddress: z.string().min(5, { message: "Address is required" }),
  billingCity: z.string().min(2, { message: "City is required" }),
  billingState: z.string().min(2, { message: "State is required" }),
  billingPostalCode: z.string().min(3, { message: "Postal code is required" }),
  billingCountry: z.string().min(2, { message: "Country is required" }),
  isDefault: z.boolean().default(false),
});

// Load Stripe outside of render to avoid recreating it on each render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// Stripe Card Input Component
const StripeCardInput = ({ onChange, onBlur, error }: any) => {
  const [cardError, setCardError] = useState<string | null>(null);

  const handleChange = (event: any) => {
    setCardError(event.error ? event.error.message : null);
    
    // Pass the event to the form controller
    if (onChange) {
      onChange(event);
    }
  };

  return (
    <div className="mt-1">
      <div className="border rounded-md p-3 focus-within:ring-2 focus-within:ring-primary">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
          onChange={handleChange}
          onBlur={onBlur}
        />
      </div>
      {cardError && <p className="text-sm text-destructive mt-1">{cardError}</p>}
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
};

// Payment Method Form Component wrapping Stripe Elements
function PaymentMethodForm({ onSubmit, isSubmitting, t }: {
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  t: any;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardComplete, setCardComplete] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Form for billing information
  const form = useForm<z.infer<typeof billingInfoSchema>>({
    resolver: zodResolver(billingInfoSchema),
    defaultValues: {
      billingName: "",
      billingEmail: "",
      billingAddress: "",
      billingCity: "",
      billingState: "",
      billingPostalCode: "",
      billingCountry: "",
      isDefault: false,
    },
  });

  const handleSubmit = async (billingData: z.infer<typeof billingInfoSchema>) => {
    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      return;
    }

    setProcessing(true);

    try {
      // Create a payment method using the card element
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: billingData.billingName,
          email: billingData.billingEmail,
          address: {
            line1: billingData.billingAddress,
            city: billingData.billingCity,
            state: billingData.billingState,
            postal_code: billingData.billingPostalCode,
            country: billingData.billingCountry,
          },
        },
      });

      if (error) {
        toast.error(`Payment method error: ${error.message}`);
        return;
      }

      // Pass payment method ID to the parent component
      onSubmit({
        stripePaymentMethodId: paymentMethod.id,
        ...billingData,
      });
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div>
          <FormLabel>{t('payment.cardInfo')}</FormLabel>
          <StripeCardInput 
            onChange={(e: any) => {
              setCardComplete(!e.empty && e.complete);
            }}
            error={form.formState.errors["card"]?.message}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {t('payment.secureProcessing')}
          </p>
        </div>
        
        <Separator className="my-4" />
        
        <h4 className="text-sm font-medium mb-3">{t('payment.billingInfo')}</h4>
        
        <FormField
          control={form.control}
          name="billingName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('payment.nameOnCard')}</FormLabel>
              <FormControl>
                <Input placeholder={t('payment.namePlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="billingEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('payment.email')}</FormLabel>
              <FormControl>
                <Input placeholder={t('payment.emailPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="billingAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('payment.billingAddress')}</FormLabel>
              <FormControl>
                <Input placeholder={t('payment.addressPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="billingCity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('payment.city')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('payment.cityPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="billingState"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('payment.state')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('payment.statePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="billingPostalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('payment.postalCode')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('payment.postalCodePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="billingCountry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('payment.country')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('payment.countryPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="isDefault"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  {t('payment.setAsDefault')}
                </FormLabel>
                <FormDescription>
                  {t('payment.defaultDescription')}
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            type="button"
            onClick={() => form.reset()}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting || processing || !stripe || !cardComplete}
          >
            {isSubmitting || processing ? t('payment.adding') : t('payment.addMethod')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function SettingsPage() {
  const t = useTranslations('Account.settings');
  const commonT = useTranslations('Account.common');
  
  const [activeTab, setActiveTab] = useState("profile");
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);

  // Fetch user data with React Query
  const { data: userData, isLoading: isLoadingUser, error: userError } = useUserProfile();
  const { data: paymentMethods, isLoading: isLoadingPayments } = usePaymentMethods();
  const { data: retailerProfile, isLoading: isLoadingRetailerProfile, refetch: refetchRetailerProfile } = useRetailerProfile();
  
  // Mutations
  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateUserProfile();
  const { mutate: updateAvatar, isPending: isUpdatingAvatar } = useUpdateUserAvatar();
  const { mutate: updateNotifications, isPending: isUpdatingNotifications } = useUpdateNotificationPreferences();
  const { mutate: deletePaymentMethod, isPending: isDeletingPayment } = useDeletePaymentMethod();
  const { mutate: setDefaultPaymentMethod, isPending: isSettingDefaultPayment } = useSetDefaultPaymentMethod();
  const { mutate: updatePassword, isPending: isUpdatingPassword } = useUpdatePassword();
  const { mutate: updateRetailerProfile, isPending: isUpdatingRetailerProfile } = useUpdateRetailerProfile();
  const { mutate: addPaymentMethod, isPending: isAddingPaymentMethod } = useAddPaymentMethod();

  // Profile form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      address: "",
      preferredLanguage: "en",
    },
  });

  // Notifications form
  const notificationsForm = useForm<z.infer<typeof notificationsFormSchema>>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      emailNotifications: true,
      orderUpdates: true,
      promotionalEmails: false,
      inventoryAlerts: true,
      priceChanges: false,
    },
  });

  // Password form
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Retailer profile form
  const retailerProfileForm = useForm<z.infer<typeof retailerProfileFormSchema>>({
    resolver: zodResolver(retailerProfileFormSchema),
    defaultValues: {
      companyName: "",
      phone: "",
      businessAddress: "",
      taxId: "",
      yearsInBusiness: "",
      
    },
  });

  // Fetch retailer profile if the user is a retailer
  useEffect(() => {
    if (userData?.role === "RETAILER") {
      refetchRetailerProfile();
    }
  }, [userData?.role, refetchRetailerProfile]);

  // Update forms when data is loaded
  useEffect(() => {
    if (userData) {
      profileForm.reset({
        name: userData.name,
        email: userData.email,
        phoneNumber: userData.phoneNumber || "",
        address: userData.address || "",
        preferredLanguage: (userData as any).preferredLanguage || "en",
      });
      
      notificationsForm.reset(userData.notifications);
    }
  }, [userData, profileForm, notificationsForm]);

  // Update retailer profile form when data is loaded
  useEffect(() => {
    if (retailerProfile) {
      retailerProfileForm.reset({
        companyName: retailerProfile.companyName,
        phone: retailerProfile.phone,
        businessAddress: retailerProfile.businessAddress,
        taxId: retailerProfile.taxId || "",
        yearsInBusiness: retailerProfile.yearsInBusiness,
      });
    }
  }, [retailerProfile, retailerProfileForm]);

  // Handle avatar upload using FileUpload component
  const handleAvatarUpload = (uploadedFiles: any[]) => {
    if (uploadedFiles.length > 0) {
      const uploadedAvatar = uploadedFiles[0];
      
      // The FileUpload component already uploads the file internally and returns metadata
      // Now just update the user record with the file URL
      updateAvatar(uploadedAvatar.fileUrl, {
        onSuccess: () => {
          toast.success("Avatar updated successfully");
        },
        onError: (error) => {
          toast.error(`Avatar upload failed: ${error.message}`);
        }
      });
    }
  };

  // Handle profile form submission
  const onProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    updateProfile(data, {
      onSuccess: () => {
        toast.success("Profile updated successfully");
      },
      onError: (error) => {
        toast.error(`Profile update failed: ${error.message}`);
      }
    });
  };

  // Handle notifications form submission
  const onNotificationsSubmit = (data: z.infer<typeof notificationsFormSchema>) => {
    updateNotifications(data, {
      onSuccess: () => {
        toast.success("Notification preferences updated");
      },
      onError: (error) => {
        toast.error(`Update failed: ${error.message}`);
      }
    });
  };

  // Handle password form submission
  const onPasswordSubmit = (data: z.infer<typeof passwordFormSchema>) => {
    updatePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    }, {
      onSuccess: () => {
        toast.success("Password updated successfully");
        passwordForm.reset();
      },
      onError: (error) => {
        toast.error(`Password update failed: ${error.message}`);
      }
    });
  };

  // Handle retailer profile form submission
  const onRetailerProfileSubmit = (data: z.infer<typeof retailerProfileFormSchema>) => {
    updateRetailerProfile(data, {
      onSuccess: () => {
        toast.success("Retailer profile updated successfully");
      },
      onError: (error) => {
        toast.error(`Update failed: ${error.message}`);
      }
    });
  };

  // Handle payment method form submission
  const onPaymentMethodSubmit = (data: any) => {
    addPaymentMethod(data, {
      onSuccess: () => {
        toast.success("Payment method added successfully");
        setShowAddPaymentForm(false);
      },
      onError: (error) => {
        toast.error(`Failed to add payment method: ${error.message}`);
      }
    });
  };

  // Handle payment method deletion
  const handleDeletePaymentMethod = (id: string) => {
    deletePaymentMethod(id, {
      onSuccess: () => {
        toast.success("Payment method removed");
      },
      onError: (error) => {
        toast.error(`Failed to remove payment method: ${error.message}`);
      }
    });
  };

  // Handle setting default payment method
  const handleSetDefaultPaymentMethod = (id: string) => {
    setDefaultPaymentMethod(id, {
      onSuccess: () => {
        toast.success("Default payment method updated");
      },
      onError: (error) => {
        toast.error(`Failed to update default payment method: ${error.message}`);
      }
    });
  };

  // Show loading state when fetching initial data
  if (isLoadingUser && !userData) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Separator />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-60 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </div>
    );
  }

  // Show error state
  if (userError) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">{t('error.title')}</h3>
          <p className="text-sm text-red-500">
            {t('error.message')}
          </p>
        </div>
        <Button onClick={() => window.location.reload()}>{t('error.retry')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>
      <Separator />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-1 md:grid-cols-5">
          <TabsTrigger value="profile">{t('tabs.profile')}</TabsTrigger>
          <TabsTrigger value="addresses">{t('tabs.addresses')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('tabs.notifications')}</TabsTrigger>
          <TabsTrigger value="security">{t('tabs.security')}</TabsTrigger>
          <TabsTrigger value="payment">{t('tabs.payment')}</TabsTrigger>
          {userData?.role === "RETAILER" && (
            <TabsTrigger value="retailer">{t('tabs.retailer')}</TabsTrigger>
          )}
        </TabsList>
        
        {/* Addresses Tab Content */}
        <AddressesTab t={t} />
        
        {/* Profile Tab Content */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.title')}</CardTitle>
              <CardDescription>
                {t('profile.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage 
                      src={userData?.avatar || undefined} 
                      alt={userData?.name || "User"} 
                    />
                    <AvatarFallback className="text-xl">
                      {userData?.name?.split(' ').map(n => n[0]).join('') || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <label className="text-sm font-medium">
                      {t('profile.avatar')}
                    </label>
                    <div className="w-full max-w-sm">
                      <FileUpload 
                        multiple={false}
                        folder="avatars"
                        maxSize={5}
                        allowedTypes={['image/jpeg', 'image/png', 'image/webp', 'image/gif']}
                        onChange={handleAvatarUpload}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('profile.avatarRequirements')}
                    </p>
                  </div>
                </div>
                
                <div className="flex-1">
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('profile.fields.name')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('profile.namePlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('profile.fields.email')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('profile.emailPlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
  control={form.control}
  name="preferredLanguage"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Preferred Language</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select your preferred language" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="nl">Dutch</SelectItem>
        </SelectContent>
      </Select>
      <FormDescription>
        Choose the language you prefer for the interface and communications.
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
                      <FormField
                        control={profileForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('profile.fields.phone')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('profile.phonePlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('profile.fields.address')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('profile.addressPlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        disabled={isUpdatingProfile || isUpdatingAvatar}
                      >
                        {isUpdatingProfile || isUpdatingAvatar ? t('profile.saving') : t('profile.saveChanges')}
                      </Button>
                    </form>
                  </Form>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notifications Tab Content */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('notifications.title')}</CardTitle>
              <CardDescription>
                {t('notifications.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationsForm}>
                <form onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)} className="space-y-8">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-3">{t('notifications.methodsTitle')}</h4>
                      <div className="space-y-4">
                        <FormField
                          control={notificationsForm.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>{t('notifications.emailNotifications')}</FormLabel>
                                <FormDescription>
                                  {t('notifications.emailDescription')}
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-sm font-medium mb-3">{t('notifications.typesTitle')}</h4>
                      <div className="space-y-4">
                        <FormField
                          control={notificationsForm.control}
                          name="orderUpdates"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>{t('notifications.orderUpdates')}</FormLabel>
                                <FormDescription>
                                  {t('notifications.orderDescription')}
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationsForm.control}
                          name="promotionalEmails"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>{t('notifications.promotionalEmails')}</FormLabel>
                                <FormDescription>
                                  {t('notifications.promotionalDescription')}
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationsForm.control}
                          name="inventoryAlerts"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>{t('notifications.inventoryAlerts')}</FormLabel>
                                <FormDescription>
                                  {t('notifications.inventoryDescription')}
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationsForm.control}
                          name="priceChanges"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>{t('notifications.priceChanges')}</FormLabel>
                                <FormDescription>
                                  {t('notifications.priceDescription')}
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit"
                    disabled={isUpdatingNotifications}
                  >
                    {isUpdatingNotifications ? t('notifications.saving') : t('notifications.savePreferences')}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab Content */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('password.title')}</CardTitle>
              <CardDescription>
                {t('password.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('password.fields.current')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder={t('password.currentPlaceholder')}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('password.fields.new')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder={t('password.newPlaceholder')}
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          {t('password.requirements')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('password.fields.confirm')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder={t('password.confirmPlaceholder')}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit"
                    disabled={isUpdatingPassword}
                  >
                    {isUpdatingPassword ? t('password.updating') : t('password.update')}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Payment Methods Tab Content */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('payment.title')}</CardTitle>
              <CardDescription>
                {t('payment.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingPayments ? (
                  <>
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </>
                ) : paymentMethods?.length ? (
                  paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-8 flex items-center justify-center bg-slate-100 rounded">
                          {method.brand === "visa" ? (
                            <span className="text-blue-600 font-bold">VISA</span>
                          ) : method.brand === "mastercard" ? (
                            <span className="text-red-600 font-bold">MC</span>
                          ) : method.brand === "amex" ? (
                            <span className="text-blue-700 font-bold">AMEX</span>
                          ) : (
                            <span>{method.brand}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} •••• {method.last4}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t('payment.expires')} {method.expiryMonth}/{method.expiryYear}
                            {method.isDefault && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                {t('payment.default')}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {!method.isDefault && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleSetDefaultPaymentMethod(method.id)}
                            disabled={isSettingDefaultPayment}
                          >
                            {t('payment.setDefault')}
                          </Button>
                        )}
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeletePaymentMethod(method.id)}
                          disabled={isDeletingPayment}
                        >
                          {t('payment.remove')}
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">{t('payment.noMethods')}</p>
                )}
                
                {!showAddPaymentForm ? (
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => setShowAddPaymentForm(true)}
                  >
                    {t('payment.addMethod')}
                  </Button>
                ) : (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>{t('payment.addTitle')}</CardTitle>
                      <CardDescription>
                        {t('payment.addDescription')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>                      <Elements stripe={stripePromise}>
                        <PaymentMethodForm 
                          onSubmit={onPaymentMethodSubmit}
                          isSubmitting={isAddingPaymentMethod}
                          t={t}
                        />
                      </Elements>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retailer Profile Tab Content - Only shown for retailers */}
        {userData?.role === "RETAILER" && (
          <TabsContent value="retailer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('retailer.title')}</CardTitle>
                <CardDescription>
                  {t('retailer.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRetailerProfile ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <Form {...retailerProfileForm}>
                    <form onSubmit={retailerProfileForm.handleSubmit(onRetailerProfileSubmit)} className="space-y-4">
                      <FormField
                        control={retailerProfileForm.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('retailer.fields.company')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('retailer.companyPlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={retailerProfileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('retailer.fields.phone')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('retailer.phonePlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={retailerProfileForm.control}
                        name="businessAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('retailer.fields.address')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('retailer.addressPlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={retailerProfileForm.control}
                        name="taxId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('retailer.fields.taxId')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('retailer.taxIdPlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={retailerProfileForm.control}
                        name="yearsInBusiness"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('retailer.fields.yearsInBusiness')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('retailer.yearsPlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit"
                        disabled={isUpdatingRetailerProfile}
                      >
                        {isUpdatingRetailerProfile ? t('retailer.saving') : t('retailer.save')}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}