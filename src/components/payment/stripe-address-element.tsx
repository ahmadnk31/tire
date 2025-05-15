import React, { useEffect, useState } from 'react';
import { AddressElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';

interface StripeAddressElementProps {
  onAddressChange: (address: any) => void;
  onComplete: () => void;
  isSubmitting?: boolean;
  title: string;
  description: string;
  buttonLabel: string;
  defaultValues?: any;
}

export function StripeAddressElement({ 
  onAddressChange, 
  onComplete, 
  isSubmitting,
  title,
  description,
  buttonLabel,
  defaultValues 
}: StripeAddressElementProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [addressComplete, setAddressComplete] = useState(false);
  const [address, setAddress] = useState<any>(null);

  // Handle the address change
  const handleAddressChange = (event: any) => {
    if (event.complete) {
      setAddressComplete(true);
      setAddress(event.value);
      onAddressChange(event.value);
    } else {
      setAddressComplete(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !addressComplete) {
      return;
    }
    
    try {
      onComplete();
    } catch (error: any) {
      console.error('Error saving address:', error);
      toast.error('Error saving address: ' + (error.message || 'Please try again'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <AddressElement 
              options={{
                mode: 'shipping',
                defaultValues: defaultValues || undefined,
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
          
          <Button 
            type="submit"
            disabled={isSubmitting || !addressComplete}
            className="w-full"
          >
            {isSubmitting ? 'Saving...' : buttonLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
