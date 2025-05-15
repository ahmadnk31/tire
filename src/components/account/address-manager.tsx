import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAddress } from '@/lib/api/user-api';
import { useUserAddresses, useDeleteUserAddress, useUpdateUserAddress } from '@/hooks/use-user-queries';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { StripeAddressElement } from '@/components/payment/stripe-address-element';
import AddressForm from '@/components/forms/address-form';

// Initialize Stripe promise
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface AddressManagerProps {
  t: (key: string) => string;
}

export function AddressManager({ t }: AddressManagerProps) {
  const { data: addresses, isLoading, error } = useUserAddresses();
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<UserAddress | null>(null);
  const deleteAddress = useDeleteUserAddress();
  const updateAddress = useUpdateUserAddress();
  
  // Handle address deletion
  const handleDeleteAddress = (id: string) => {
    deleteAddress.mutate(id, {
      onSuccess: () => {
        toast.success(t('addresses.deleted'));
      },
      onError: (error) => {
        toast.error(t('addresses.deleteError') + ': ' + error.message);
      }
    });
  };
  
  // Handle setting an address as default
  const handleSetDefaultAddress = (address: UserAddress) => {
    if (address.isDefault) return;
    
    updateAddress.mutate({
      id: address.id,
      data: { isDefault: true }
    }, {
      onSuccess: () => {
        toast.success(t('addresses.defaultUpdated'));
      },
      onError: (error) => {
        toast.error(t('addresses.updateError') + ': ' + error.message);
      }
    });
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('addresses.title')}</CardTitle>
          <CardDescription>{t('addresses.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('addresses.title')}</CardTitle>
          <CardDescription>{t('error.message')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.reload()}>
            {t('error.retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('addresses.title')}</CardTitle>
        <CardDescription>{t('addresses.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* List of existing addresses */}
          {addresses && addresses.length > 0 ? (
            addresses.map((address) => (
              <div key={address.id} className="flex items-start justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">
                      {address.firstName} {address.lastName}
                      {address.isDefault && (
                        <Badge className="ml-2" variant="outline">
                          {t('addresses.default')}
                        </Badge>
                      )}
                    </h4>
                    <Badge>{address.addressType}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {address.addressLine1}
                    {address.addressLine2 && <>, {address.addressLine2}</>}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.city}, {address.state} {address.postalCode}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.country}
                  </p>
                  {address.phoneNumber && (
                    <p className="text-sm text-muted-foreground">
                      {t('addresses.phone')}: {address.phoneNumber}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  {!address.isDefault && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleSetDefaultAddress(address)}
                      disabled={updateAddress.isPending}
                    >
                      {t('addresses.setDefault')}
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setAddressToEdit(address)}
                  >
                    {t('addresses.edit')}
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDeleteAddress(address.id)}
                    disabled={deleteAddress.isPending}
                  >
                    {t('addresses.remove')}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4">
              {t('addresses.noAddresses')}
            </p>
          )}
          
          {/* Add address button */}
          {!showAddAddressForm && !addressToEdit && (
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setShowAddAddressForm(true)}
            >
              {t('addresses.addAddress')}
            </Button>
          )}
          
          {/* Add address form */}
          {showAddAddressForm && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>{t('addresses.addTitle')}</CardTitle>
                <CardDescription>
                  {t('addresses.addDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise}>
                  <AddressForm
                    mode="create"
                    onCancel={() => setShowAddAddressForm(false)}
                    t={t}
                  />
                </Elements>
              </CardContent>
            </Card>
          )}
          
          {/* Edit address form */}
          {addressToEdit && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>{t('addresses.editTitle')}</CardTitle>
                <CardDescription>
                  {t('addresses.editDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise}>
                  <AddressForm
                    mode="edit"
                    address={addressToEdit}
                    onCancel={() => setAddressToEdit(null)}
                    t={t}
                  />
                </Elements>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
