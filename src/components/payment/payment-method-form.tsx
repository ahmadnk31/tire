import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { AddressElement } from '@stripe/react-stripe-js';

interface PaymentMethodFormProps {
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  t: (key: string) => string;
}

export function PaymentMethodForm({ onSubmit, isSubmitting, t }: PaymentMethodFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardComplete, setCardComplete] = useState(false);
  const [addressComplete, setAddressComplete] = useState(false);
  const [address, setAddress] = useState<any>(null);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleCardChange = (event: any) => {
    setCardComplete(event.complete);
    if (event.error) {
      setCardError(event.error.message);
    } else {
      setCardError(null);
    }
  };

  const handleAddressChange = (event: any) => {
    if (event.complete) {
      setAddressComplete(true);
      setAddress(event.value);
    } else {
      setAddressComplete(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable form submission until Stripe.js has loaded
      return;
    }

    if (!cardComplete || !addressComplete) {
      return;
    }

    try {
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // Create a payment method with the card and billing details
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: `${address.firstName} ${address.lastName}`,
          email: address.email || '',
          phone: address.phone || '',
          address: {
            line1: address.address.line1,
            line2: address.address.line2 || '',
            city: address.address.city,
            state: address.address.state,
            postal_code: address.address.postal_code,
            country: address.address.country,
          },
        },
      });

      if (error) {
        console.error('[error]', error);
        setCardError(error.message || 'An error occurred with your card');
        return;
      }

      // Pass the payment method ID to the parent component
      onSubmit({
        stripePaymentMethodId: paymentMethod.id,
        isDefault: true,
        // Include billing address details for the API
        billingName: `${address.firstName} ${address.lastName}`,
        billingEmail: address.email || '',
        billingPhone: address.phone || '',
        billingAddress: address.address.line1,
        billingCity: address.address.city,
        billingState: address.address.state,
        billingPostalCode: address.address.postal_code,
        billingCountry: address.address.country,
      });
    } catch (err: any) {
      console.error('Error creating payment method:', err);
      setCardError(err.message || 'An unexpected error occurred');
    }
  };

  return (
    
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="card-element">
              {t('payment.cardDetails')}
            </label>
            <div className="border rounded-md p-3">
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
                  hidePostalCode: true,
                }}
                onChange={handleCardChange}
              />
            </div>
            {cardError && <p className="text-sm text-red-500">{cardError}</p>}
          </div>
          
          <div className="space-y-2 mt-4">
            <label className="text-sm font-medium">
              {t('payment.billingAddress')}
            </label>
            <div className="border rounded-md p-3">
              <AddressElement 
                options={{
                  mode: 'billing',
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
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={!cardComplete || !addressComplete || isSubmitting || !stripe || !elements}
        >
          {isSubmitting ? t('payment.processing') : t('payment.addCard')}
        </Button>
      </form>
    
  );
}
