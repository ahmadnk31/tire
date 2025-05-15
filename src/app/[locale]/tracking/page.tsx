"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface DeliveryOption {
  id: string;
  reasonName: string;
  reasonDescription: string;
}

interface Transaction {
  tuNumbers: string[];
  transactionID: string;
  responsibleCountryA2: string;
  originalConsignee: {
    postalArea: {
      postalCode: string;
      postalCodeDisplay: string;
      city: string;
    };
    street1: string;
    blockNo1?: string;
  };
  responsibleLocation: string;
  responsibleLocationCode: string;
  satLocation: string;
  satLocationCode: string;
}

interface TrackingResult {
  exitCode: string;
  content: {
    transactions: Transaction[];
    deliveryOptions: DeliveryOption[];
  };
}

export default function TrackingPage() {
  const [parcelId, setParcelId] = useState("2WPRrHdRMTlZHuBdn7hJ39");
  const [postalCode, setPostalCode] = useState("");
  const [key, setKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // Authentication state
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [activeTab, setActiveTab] = useState("track");

  // Authenticate with the GLS API
  const authenticateGLS = async () => {
    if (!clientId || !clientSecret) {
      toast.error("Please enter your GLS client ID and secret");
      return;
    }

    setIsAuthenticating(true);
    try {
      // Create base64 encoded auth string
      const authString = btoa(`${clientId}:${clientSecret}`);

      // Create form data with precise format
      const formData = new URLSearchParams();
      formData.append("grant_type", "client_credentials");

      // Use fetch API to get token
      const response = await fetch(
        "https://api-sandbox.gls-group.net/oauth2/v2/token",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${authString}`,
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Authentication failed: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      setAuthToken(data.access_token);
      toast.success("Successfully authenticated with GLS API");

      // Switch to tracking tab after successful authentication
      setActiveTab("track");
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast.error(`Failed to authenticate: ${error.message}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleTrackParcel = async () => {
    if (!parcelId.trim()) {
      toast.error("Please enter a valid parcel ID");
      return;
    }

    if (!authToken) {
      toast.error("Please authenticate with GLS first");
      setActiveTab("auth");
      return;
    }

    setIsLoading(true);
    setError(null);
    setTrackingResult(null);

    try {
      // Build the query string for optional parameters
      const queryParams = new URLSearchParams();
      if (postalCode) queryParams.append("postalCode", postalCode);
      if (key) queryParams.append("key", key);
      // Add the authentication token
      queryParams.append("token", authToken);

      // Call our API endpoint
      const response = await fetch(
        `/api/shipping/gls-tracking/${parcelId}/options?${queryParams.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Error ${response.status}: Failed to fetch tracking information`
        );
      }

      const data = await response.json();
      setTrackingResult(data);
      toast.success("Tracking information retrieved successfully");
    } catch (err: any) {
      setError(err.message || "Failed to track the parcel. Please try again.");
      toast.error("Failed to retrieve tracking information");
      console.error("Tracking error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='container py-10'>
      <h1 className='text-3xl font-bold mb-6'>GLS Parcel Tracking</h1>
      <p className='text-gray-500 mb-8'>
        Track your GLS package and view available delivery options.
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='mb-8'>
        <TabsList className='grid w-[400px] grid-cols-2'>
          <TabsTrigger value='auth'>Authentication</TabsTrigger>
          <TabsTrigger value='track'>Track Parcel</TabsTrigger>
        </TabsList>

        <TabsContent value='auth'>
          <div className='max-w-md'>
            <Card>
              <CardHeader>
                <CardTitle>GLS API Authentication</CardTitle>
                <CardDescription>
                  Enter your GLS API credentials to authenticate
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='clientId'>Client ID</Label>
                  <Input
                    id='clientId'
                    placeholder='Enter your GLS client ID'
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='clientSecret'>Client Secret</Label>
                  <Input
                    id='clientSecret'
                    type='password'
                    placeholder='Enter your GLS client secret'
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={authenticateGLS}
                  disabled={isAuthenticating || !clientId || !clientSecret}
                >
                  {isAuthenticating ? "Authenticating..." : "Authenticate"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='track'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Tracking Input Form */}
            <Card>
              <CardHeader>
                <CardTitle>Track Your Parcel</CardTitle>
                <CardDescription>
                  Enter your parcel ID to check delivery options
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='parcelId'>Parcel ID</Label>
                  <Input
                    id='parcelId'
                    placeholder='Enter parcel ID'
                    value={parcelId}
                    onChange={(e) => setParcelId(e.target.value)}
                  />
                  <p className='text-sm text-gray-500'>
                    Enter a parcel number (11-12 digits), track ID (8 digits),
                    notification card ID (6 digits), or digital notification
                    card ID (14 digits)
                  </p>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='postalCode'>Postal Code (Optional)</Label>
                  <Input
                    id='postalCode'
                    placeholder='e.g., 65760'
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='key'>FDS Key (Optional)</Label>
                  <Input
                    id='key'
                    placeholder='FDS Key if required'
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                  />
                </div>

                {!authToken && (
                  <div className='p-4 bg-amber-50 text-amber-600 rounded-md'>
                    <p className='font-medium'>Authentication Required</p>
                    <p>
                      Please authenticate with GLS API first to track parcels.
                    </p>
                  </div>
                )}

                {authToken && (
                  <div className='p-4 bg-green-50 text-green-600 rounded-md'>
                    <p className='font-medium'>Authentication Status</p>
                    <p>✓ Authenticated with GLS API</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleTrackParcel}
                  disabled={isLoading || !authToken}
                >
                  {isLoading ? "Tracking..." : "Track Parcel"}
                </Button>
              </CardFooter>
            </Card>

            {/* Results Display */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Options</CardTitle>
                <CardDescription>
                  Available delivery options for your parcel
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error ? (
                  <div className='p-4 bg-red-50 text-red-600 rounded-md'>
                    <p className='font-medium'>Error</p>
                    <p>{error}</p>
                  </div>
                ) : isLoading ? (
                  <div className='flex items-center justify-center h-40'>
                    <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
                  </div>
                ) : trackingResult ? (
                  <div className='space-y-4'>
                    <div>
                      <h3 className='text-lg font-semibold mb-2'>
                        Package Information
                      </h3>
                      {trackingResult.content.transactions.map(
                        (transaction, i) => (
                          <div key={i} className='bg-slate-50 p-4 rounded-md'>
                            <p>
                              <span className='font-medium'>
                                Transaction ID:
                              </span>{" "}
                              {transaction.transactionID}
                            </p>
                            <p>
                              <span className='font-medium'>Country:</span>{" "}
                              {transaction.responsibleCountryA2}
                            </p>
                            <p>
                              <span className='font-medium'>
                                Consignee Address:
                              </span>{" "}
                              {transaction.originalConsignee.street1}{" "}
                              {transaction.originalConsignee.blockNo1},{" "}
                              {
                                transaction.originalConsignee.postalArea
                                  .postalCodeDisplay
                              }{" "}
                              {transaction.originalConsignee.postalArea.city}
                            </p>
                            <p>
                              <span className='font-medium'>
                                Parcel Numbers:
                              </span>{" "}
                              {transaction.tuNumbers.join(", ")}
                            </p>
                          </div>
                        )
                      )}
                    </div>

                    <div>
                      <h3 className='text-lg font-semibold mb-2'>
                        Available Delivery Options
                      </h3>
                      <div className='space-y-2'>
                        {trackingResult.content.deliveryOptions.map(
                          (option) => (
                            <div
                              key={option.id}
                              className='p-3 border rounded-md hover:bg-slate-50'
                            >
                              <p className='font-medium'>
                                {option.reasonDescription}
                              </p>
                              <p className='text-sm text-gray-500'>
                                Option ID: {option.id} ({option.reasonName})
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className='text-center p-6 text-gray-500'>
                    Enter a parcel ID and click Track Parcel to see delivery
                    options
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
