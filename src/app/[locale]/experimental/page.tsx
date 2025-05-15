"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AddressAutocomplete from "@/components/address-autocomplete";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import axios from "axios";
import { Badge } from "@/components/ui/badge";

// Type definitions
interface ShippingCredentials {
  clientId: string;
  clientSecret: string;
  accountNumber?: string;
}

interface ShippingProvider {
  name: string;
  apiEndpoint: string;
  credentials: ShippingCredentials;
}

interface Address {
  firstName: string;
  lastName: string;
  street: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
  state?: string;
  phone?: string;
  email?: string;
  houseNumber?: string;
}

interface ShippingRate {
  id: string;
  provider: string;
  service: string;
  transitDays: number;
  price: number;
  currency: string;
  description?: string;
}

export default function ExperimentalPage() {
  // State for shipping provider configuration
  const [activeTab, setActiveTab] = useState("shipping");
  const [isLoading, setIsLoading] = useState(false);
  const [authResponse, setAuthResponse] = useState<any>(null);
  const [shippingProvider, setShippingProvider] = useState<ShippingProvider>({
    name: "GLS",
    apiEndpoint: "https://api-sandbox.gls-group.net/oauth2/v2/token",
    credentials: {
      clientId: "",
      clientSecret: "",
      accountNumber: "",
    },
  });

  // State for address validation
  const [address, setAddress] = useState<Address>({
    firstName: "John",
    lastName: "Doe",
    street: "Main Street 123",
    city: "Brussels",
    postalCode: "1000",
    country: "BE",
    phone: "+32612345678",
    email: "test@example.com",
  });

  const [validatedAddress, setValidatedAddress] = useState<Address | null>(
    null
  );
  const [isAddressValidated, setIsAddressValidated] = useState(false);

  // State for address validation result
  const [validationResult, setValidationResult] = useState<any>(null);

  // State for shipping rates
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);

  // State for full street address input (for autocomplete)
  const [fullStreetAddress, setFullStreetAddress] = useState("");

  // Handle credential changes
  const handleCredentialChange = (
    field: keyof ShippingCredentials,
    value: string
  ) => {
    setShippingProvider({
      ...shippingProvider,
      credentials: {
        ...shippingProvider.credentials,
        [field]: value,
      },
    });
  };

  // Handle address field changes
  const handleAddressChange = (field: keyof Address, value: string) => {
    setAddress({
      ...address,
      [field]: value,
    });
  };

  // Modified approach to directly use Google-validated addresses
  const handleAddressSelected = (data: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    formatted: string;
  }) => {
    // When an address is selected from Google autocomplete, consider it pre-validated
    const newAddress = {
      ...address,
      street: data.addressLine1,
      addressLine2: data.addressLine2 || "",
      city: data.city,
      postalCode: data.postalCode,
      country: data.country || "BE",
    };

    setAddress(newAddress);
    // We can consider the address valid since it came from Google
    setIsAddressValidated(true);
    setValidatedAddress(newAddress);
    toast.success("Address selected and validated via Google");
  };

  // Authenticate with the shipping provider
  const authenticateProvider = async () => {
    setIsLoading(true);
    setAuthResponse(null);

    try {
      // Create base64 encoded auth string
      const authString = btoa(
        `${shippingProvider.credentials.clientId}:${shippingProvider.credentials.clientSecret}`
      );

      // Create form data with precise format
      const formData = new URLSearchParams();
      formData.append("grant_type", "client_credentials");

      // Use fetch API to get token
      const response = await fetch(shippingProvider.apiEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Basic ${authString}`,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      if (!response.ok) {
        // Get error details if possible
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: `HTTP error ${response.status}` };
        }
        throw new Error(
          `Authentication failed: ${response.status} ${JSON.stringify(
            errorData
          )}`
        );
      }

      const data = await response.json();
      setAuthResponse(data);
      toast.success(`Successfully authenticated with ${shippingProvider.name}`);
    } catch (error: any) {
      console.error("Authentication error:", error);
      setAuthResponse(error.response?.data || { error: error.message });
      toast.error(`Failed to authenticate: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Simplified get shipping rates - no need for prior GLS validation
  const getShippingRates = async () => {
    setIsLoading(true);
    setShippingRates([]);
    try {
      const token = authResponse?.access_token;

      if (!token) {
        toast.error("Please authenticate first to get a valid token");
        return;
      }

      // Send request directly to GLS for rates using our API endpoint
      const response = await fetch("/api/shipping/gls-rates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
          shipmentDetails: {
            sender: {
              zipCode: "1000", // This should be your warehouse/shipping origin zipcode
              city: "Brussels",
              countryCode: "BE",
            },
            receiver: {
              name1: address.firstName + " " + address.lastName,
              street1: address.street,
              zipCode: address.postalCode,
              city: address.city,
              countryCode: address.country,
            },
            packages: [
              {
                weight: 5, // Weight in kg - should be dynamic based on your products
                length: 20, // Length in cm
                width: 15, // Width in cm
                height: 10, // Height in cm
              },
            ],
            product: "PARCEL", // The product type
            accountNumber: shippingProvider.credentials.accountNumber || "",
          },
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: `HTTP error ${response.status}` };
        }
        throw new Error(
          `Failed to get rates: ${response.status} ${JSON.stringify(errorData)}`
        );
      }

      const ratesResult = await response.json();
      console.log("Shipping rates result:", ratesResult);

      // Transform the GLS rates format to your application's format
      const transformedRates = ratesResult.services.map((service: any) => ({
        id:
          service.code ||
          `gls-${service.name.toLowerCase().replace(/\s+/g, "-")}`,
        provider: "GLS",
        service: service.name,
        transitDays: service.transitTime || 3,
        price: service.totalPrice.amount || 0,
        currency: service.totalPrice.currency || "EUR",
        description: service.description || "",
      }));

      setShippingRates(transformedRates);
      toast.success("Shipping rates retrieved");
    } catch (error: any) {
      console.error("Get rates error:", error);
      toast.error(`Failed to get shipping rates: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a transit shipment with GLS
  const createTransitShipment = async () => {
    setIsLoading(true);
    try {
      const token = authResponse?.access_token;

      if (!token) {
        toast.error("Please authenticate first to get a valid token");
        return;
      }

      if (!isAddressValidated) {
        toast.warning("Using non-validated address for shipment creation");
      }

      // Prepare transit shipment data based on form values
      // Using the correct format as per the GLS API requirements
      const transitShipment = {
        parcelNumbers: ["00012345678"], // 11 digits format
        // Alternative format: ["ABCD1234"] - 8 uppercase alphanumeric chars
        saveAsDraft: true, // Save as draft first to avoid automatic processing
        exporter: {
          address: {
            name1: "Your Company Name",
            street1: "Warehouse Street",
            postcode: "1000",
            city1: "Brussels",
            countryCode: "BE",
          },
        },
        importer: {
          address: {
            name1: address.firstName + " " + address.lastName,
            street1: address.street,
            postcode: address.postalCode,
            city1: address.city,
            countryCode: address.country,
          },
        },
        lineItems: [
          {
            commodityCode: "401110", // Tariff code for new pneumatic tires of rubber
            goodsDescription: "Car tires", // Should be descriptive
            grossWeight: {
              amount: 25, // Changed from "value" to "amount"
              unit: "KGM", // Changed from "kg" to "KGM"
            },
            netWeight: {
              amount: 23.5, // Changed from "value" to "amount"
              unit: "KGM", // Changed from "kg" to "KGM"
            },
          },
        ],
      };

      // Call our API endpoint
      const response = await fetch("/api/shipping/gls-transit-shipments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          transitShipment,
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: `HTTP error ${response.status}` };
        }
        throw new Error(
          `Failed to create shipment: ${response.status} ${JSON.stringify(
            errorData
          )}`
        );
      }

      const result = await response.json();
      console.log("Shipment creation result:", result);
      toast.success("Transit shipment created successfully");
    } catch (error: any) {
      console.error("Shipment creation error:", error);
      toast.error(`Failed to create shipment: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='container py-10'>
      <h1 className='text-3xl font-bold mb-6'>Experimental Testing Page</h1>
      <p className='text-gray-500 mb-8'>
        Use this page to test various functionalities in a sandbox environment.
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='grid grid-cols-2 w-[400px]'>
          <TabsTrigger value='shipping'>Shipping Integration</TabsTrigger>
          <TabsTrigger value='payment'>Payment Testing</TabsTrigger>
        </TabsList>

        <TabsContent value='shipping' className='mt-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Provider Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Provider Configuration</CardTitle>
                <CardDescription>
                  Configure shipping provider authentication details
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='provider'>Provider</Label>
                  <Select
                    value={shippingProvider.name}
                    onValueChange={(value) => {
                      // In a real app, this would update the endpoint and possibly the credentials format
                      setShippingProvider({
                        ...shippingProvider,
                        name: value,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select provider' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='GLS'>GLS</SelectItem>
                      <SelectItem value='DHL'>DHL</SelectItem>
                      <SelectItem value='UPS'>UPS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='apiEndpoint'>API Endpoint</Label>
                  <Input
                    id='apiEndpoint'
                    value={shippingProvider.apiEndpoint}
                    onChange={(e) =>
                      setShippingProvider({
                        ...shippingProvider,
                        apiEndpoint: e.target.value,
                      })
                    }
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='clientId'>Client ID</Label>
                  <Input
                    id='clientId'
                    value={shippingProvider.credentials.clientId}
                    onChange={(e) =>
                      handleCredentialChange("clientId", e.target.value)
                    }
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='clientSecret'>Client Secret</Label>
                  <Input
                    id='clientSecret'
                    type='password'
                    value={shippingProvider.credentials.clientSecret}
                    onChange={(e) =>
                      handleCredentialChange("clientSecret", e.target.value)
                    }
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='accountNumber'>
                    Account Number (Optional)
                  </Label>
                  <Input
                    id='accountNumber'
                    value={shippingProvider.credentials.accountNumber}
                    onChange={(e) =>
                      handleCredentialChange("accountNumber", e.target.value)
                    }
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={authenticateProvider}
                  disabled={
                    isLoading ||
                    !shippingProvider.credentials.clientId ||
                    !shippingProvider.credentials.clientSecret
                  }
                >
                  {isLoading ? "Authenticating..." : "Authenticate"}
                </Button>
              </CardFooter>
            </Card>

            {/* Authentication Results */}
            <Card>
              <CardHeader>
                <CardTitle>Authentication Results</CardTitle>
                <CardDescription>
                  View the results of your authentication attempt
                </CardDescription>
              </CardHeader>
              <CardContent className='h-[300px] overflow-auto'>
                <pre className='bg-slate-100 p-4 rounded text-sm'>
                  {authResponse
                    ? JSON.stringify(authResponse, null, 2)
                    : "No authentication attempt yet"}
                </pre>
              </CardContent>
            </Card>

            {/* Address Validation */}
            <Card>
              <CardHeader>
                <CardTitle>Address Validation</CardTitle>
                <CardDescription>
                  Test address validation with the shipping provider
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='firstName'>First Name</Label>
                    <Input
                      id='firstName'
                      value={address.firstName}
                      onChange={(e) =>
                        handleAddressChange("firstName", e.target.value)
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='lastName'>Last Name</Label>
                    <Input
                      id='lastName'
                      value={address.lastName}
                      onChange={(e) =>
                        handleAddressChange("lastName", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='address'>Street Address</Label>
                  <AddressAutocomplete
                    onAddressSelected={handleAddressSelected}
                    placeholder='Enter your street address'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='street'>Street Address (Manual Input)</Label>
                  <Input
                    id='street'
                    value={address.street}
                    onChange={(e) =>
                      handleAddressChange("street", e.target.value)
                    }
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='addressLine2'>
                    Address Line 2 (Optional)
                  </Label>
                  <Input
                    id='addressLine2'
                    value={address.addressLine2 || ""}
                    onChange={(e) =>
                      handleAddressChange("addressLine2", e.target.value)
                    }
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='city'>City</Label>
                    <Input
                      id='city'
                      value={address.city}
                      onChange={(e) =>
                        handleAddressChange("city", e.target.value)
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='postalCode'>Postal Code</Label>
                    <Input
                      id='postalCode'
                      value={address.postalCode}
                      onChange={(e) =>
                        handleAddressChange("postalCode", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='country'>Country</Label>
                  <Select
                    value={address.country}
                    onValueChange={(value) =>
                      handleAddressChange("country", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select country' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='BE'>Belgium</SelectItem>
                      <SelectItem value='NL'>Netherlands</SelectItem>
                      <SelectItem value='DE'>Germany</SelectItem>
                      <SelectItem value='FR'>France</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='phone'>Phone</Label>
                    <Input
                      id='phone'
                      value={address.phone || ""}
                      onChange={(e) =>
                        handleAddressChange("phone", e.target.value)
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='email'>Email</Label>
                    <Input
                      id='email'
                      value={address.email || ""}
                      onChange={(e) =>
                        handleAddressChange("email", e.target.value)
                      }
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className='flex gap-2'>
                <Button
                  onClick={getShippingRates}
                  disabled={isLoading || !authResponse?.access_token}
                  variant='outline'
                >
                  Get Shipping Rates
                </Button>
                <Button
                  onClick={createTransitShipment}
                  disabled={isLoading || !authResponse?.access_token}
                >
                  Create Transit Shipment
                </Button>
              </CardFooter>
            </Card>

            {/* Validated Address Information */}
            <Card>
              <CardHeader>
                <CardTitle>Validated Address</CardTitle>
                <CardDescription>
                  {isAddressValidated
                    ? "Address has been validated"
                    : "Address has not been validated yet"}
                </CardDescription>
              </CardHeader>
              <CardContent className='h-[200px] overflow-auto'>
                <pre className='bg-slate-100 p-4 rounded text-sm'>
                  {validatedAddress
                    ? JSON.stringify(validatedAddress, null, 2)
                    : "Address not validated yet"}
                </pre>
              </CardContent>
            </Card>

            {/* Shipping Rates */}
            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>
                  Validation results and available shipping options
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Shipping Rates */}
                <h3 className='font-medium mb-2'>Shipping Options</h3>
                {shippingRates.length > 0 ? (
                  <div className='space-y-4'>
                    {shippingRates.map((rate) => (
                      <div
                        key={rate.id}
                        className='p-4 border rounded hover:bg-slate-50 cursor-pointer'
                      >
                        <div className='flex justify-between'>
                          <div className='font-medium'>{rate.service}</div>
                          <div className='font-bold'>
                            {rate.price.toFixed(2)} {rate.currency}
                          </div>
                        </div>
                        <div className='text-sm text-gray-500 mt-1'>
                          Delivery in {rate.transitDays}{" "}
                          {rate.transitDays === 1 ? "day" : "days"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center p-6 text-gray-500'>
                    No shipping rates available yet. Authenticate and get rates
                    to see options here.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='payment' className='mt-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Payment Testing Card */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Testing</CardTitle>
                <CardDescription>
                  Test payment processing functionalities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='text-center p-6'>
                  <p>Payment testing functionality will be added soon.</p>
                  <p className='text-sm text-gray-500 mt-2'>
                    Check back later for payment integration testing options.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Debug Information */}
      <div className='mt-12'>
        <h2 className='text-xl font-semibold mb-4'>Debug Information</h2>
        <Separator className='my-4' />
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <h3 className='font-medium mb-2'>Current Provider State</h3>
            <pre className='bg-slate-100 p-4 rounded text-sm'>
              {JSON.stringify(shippingProvider, null, 2)}
            </pre>
          </div>
          <div>
            <h3 className='font-medium mb-2'>Current Address State</h3>
            <pre className='bg-slate-100 p-4 rounded text-sm'>
              {JSON.stringify(address, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
