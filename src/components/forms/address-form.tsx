import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateUserAddress, useUpdateUserAddress } from '@/hooks/use-user-queries';
import { AddressElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'sonner';
import { UserAddress } from '@/lib/api/user-api';
import { Checkbox } from '@/components/ui/checkbox';

// Form schema for address validation
const addressSchema = z.object({
  addressType: z.enum(['SHIPPING', 'BILLING', 'BOTH']),
  isDefault: z.boolean().default(false),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  addressLine1: z.string().min(1, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  phoneNumber: z.string().optional(),
  company: z.string().optional(),
  deliveryInstructions: z.string().optional(),
});

interface AddressFormProps {
  mode: 'create' | 'edit';
  address?: UserAddress;
  onCancel: () => void;
  t: (key: string) => string;
}

export default function AddressForm({ mode, address, onCancel, t }: AddressFormProps) {
  const [useStripeElement, setUseStripeElement] = useState(true);
  const stripe = useStripe();
  const elements = useElements();
  const [addressComplete, setAddressComplete] = useState(false);
  const [stripeAddress, setStripeAddress] = useState<any>(null);
  
  const createAddress = useCreateUserAddress();
  const updateAddress = useUpdateUserAddress();
  
  // Initialize form with default values or existing address data
  const form = useForm<z.infer<typeof addressSchema>>({
    resolver: zodResolver(addressSchema),
    defaultValues: address ? {
      addressType: address.addressType,
      isDefault: address.isDefault,
      firstName: address.firstName,
      lastName: address.lastName,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || undefined,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      phoneNumber: address.phoneNumber || undefined,
      company: address.company || undefined,
      deliveryInstructions: address.deliveryInstructions || undefined,
    } : {
      addressType: 'SHIPPING',
      isDefault: false,
      firstName: '',
      lastName: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      phoneNumber: '',
      company: '',
      deliveryInstructions: '',
    },
  });

  // Handle Stripe address element changes
  const handleAddressChange = (event: any) => {
    if (event.complete) {
      setAddressComplete(true);
      setStripeAddress(event.value);
    } else {
      setAddressComplete(false);
    }
  };

  // Handle form submission with standard form
  const onSubmit = (data: z.infer<typeof addressSchema>) => {
    if (mode === 'create') {
      createAddress.mutate(data, {
        onSuccess: () => {
          toast.success(t('addresses.created'));
          onCancel();
        },
        onError: (error) => {
          toast.error(t('addresses.createError') + ': ' + error.message);
        }
      });
    } else if (mode === 'edit' && address) {
      updateAddress.mutate({
        id: address.id,
        data
      }, {
        onSuccess: () => {
          toast.success(t('addresses.updated'));
          onCancel();
        },
        onError: (error) => {
          toast.error(t('addresses.updateError') + ': ' + error.message);
        }
      });
    }
  };

  // Handle form submission with Stripe address
  const handleStripeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !stripeAddress) {
      return;
    }
    
    const addressData = form.getValues();
    const addr = stripeAddress.address;
    
    // Combine Stripe address data with form data
    const combinedData = {
      ...addressData,
      firstName: stripeAddress.firstName || addressData.firstName,
      lastName: stripeAddress.lastName || addressData.lastName,
      addressLine1: addr.line1,
      addressLine2: addr.line2 || undefined,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postal_code,
      country: addr.country,
      phoneNumber: stripeAddress.phone || addressData.phoneNumber,
    };
    
    if (mode === 'create') {
      createAddress.mutate(combinedData, {
        onSuccess: () => {
          toast.success(t('addresses.created'));
          onCancel();
        },
        onError: (error) => {
          toast.error(t('addresses.createError') + ': ' + error.message);
        }
      });
    } else if (mode === 'edit' && address) {
      updateAddress.mutate({
        id: address.id,
        data: combinedData
      }, {
        onSuccess: () => {
          toast.success(t('addresses.updated'));
          onCancel();
        },
        onError: (error) => {
          toast.error(t('addresses.updateError') + ': ' + error.message);
        }
      });
    }
  };
  
  // Determine if we're in a loading state
  const isSubmitting = createAddress.isPending || updateAddress.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="use-stripe-element" 
          checked={useStripeElement}
          onCheckedChange={(checked) => setUseStripeElement(!!checked)}
        />
        <label
          htmlFor="use-stripe-element"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {t('addresses.useStripeElement')}
        </label>
      </div>
      
      {useStripeElement ? (
        <form onSubmit={handleStripeSubmit} className="space-y-6">
          <FormField
            control={form.control}
            name="addressType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('addresses.fields.type')}</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('addresses.selectType')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="SHIPPING">{t('addresses.types.shipping')}</SelectItem>
                    <SelectItem value="BILLING">{t('addresses.types.billing')}</SelectItem>
                    <SelectItem value="BOTH">{t('addresses.types.both')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="isDefault"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    {t('addresses.fields.default')}
                  </FormLabel>
                  <FormDescription>
                    {t('addresses.defaultDescription')}
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('addresses.fields.company')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('addresses.companyPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="border rounded-md p-3">
            <AddressElement 
              options={{
                mode: form.getValues().addressType === 'BILLING' ? 'billing' : 'shipping',
                defaultValues: address ? {
                  name: `${address.firstName} ${address.lastName}`,
                  address: {
                    line1: address.addressLine1,
                    line2: address.addressLine2 || '',
                    city: address.city,
                    state: address.state,
                    postal_code: address.postalCode,
                    country: address.country,
                  },
                  phone: address.phoneNumber || '',
                } : undefined,
                fields: {
                  phone: 'always',
                },
                validation: {
                  phone: {
                    required: 'always',
                  },
                },
              }}
              onChange={handleAddressChange}
            />
          </div>

          <FormField
            control={form.control}
            name="deliveryInstructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('addresses.fields.instructions')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('addresses.instructionsPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end space-x-2">
            <Button 
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting || !addressComplete}
            >
              {isSubmitting ? t('common.saving') : mode === 'create' ? t('addresses.add') : t('addresses.update')}
            </Button>
          </div>
        </form>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="addressType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('addresses.fields.type')}</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('addresses.selectType')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SHIPPING">{t('addresses.types.shipping')}</SelectItem>
                      <SelectItem value="BILLING">{t('addresses.types.billing')}</SelectItem>
                      <SelectItem value="BOTH">{t('addresses.types.both')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      {t('addresses.fields.default')}
                    </FormLabel>
                    <FormDescription>
                      {t('addresses.defaultDescription')}
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('addresses.fields.firstName')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('addresses.firstNamePlaceholder')} {...field} />
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
                    <FormLabel>{t('addresses.fields.lastName')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('addresses.lastNamePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('addresses.fields.company')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('addresses.companyPlaceholder')} {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="addressLine1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('addresses.fields.address1')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('addresses.address1Placeholder')} {...field} />
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
                  <FormLabel>{t('addresses.fields.address2')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('addresses.address2Placeholder')} {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('addresses.fields.city')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('addresses.cityPlaceholder')} {...field} />
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
                    <FormLabel>{t('addresses.fields.state')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('addresses.statePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('addresses.fields.postalCode')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('addresses.postalCodePlaceholder')} {...field} />
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
                    <FormLabel>{t('addresses.fields.country')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('addresses.countryPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('addresses.fields.phone')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('addresses.phonePlaceholder')} {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="deliveryInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('addresses.fields.instructions')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('addresses.instructionsPlaceholder')} {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('common.saving') : mode === 'create' ? t('addresses.add') : t('addresses.update')}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
