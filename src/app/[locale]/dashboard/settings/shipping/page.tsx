"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlertCircle, CheckCircle, Loader2, Truck } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define the form schema
const shippingSettingsSchema = z.object({
  defaultProvider: z.string({
    required_error: "Please select a default shipping provider",
  }),
});

type ShippingSettingsFormValues = z.infer<typeof shippingSettingsSchema>;

export default function ShippingSettingsPage() {
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [defaultProvider, setDefaultProvider] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the form
  const form = useForm<ShippingSettingsFormValues>({
    resolver: zodResolver(shippingSettingsSchema),
    defaultValues: {
      defaultProvider: "",
    },
  });

  // Fetch available shipping providers and current default on page load
  useEffect(() => {
    const fetchShippingSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/settings/shipping');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch shipping settings: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.availableProviders && Array.isArray(data.availableProviders)) {
          setAvailableProviders(data.availableProviders);
        } else {
          setAvailableProviders(['DHL', 'FedEx', 'GLS']); // Fallback providers
        }
        
        if (data.defaultProvider) {
          setDefaultProvider(data.defaultProvider);
          
          form.reset({
            defaultProvider: data.defaultProvider,
          });
        }
      } catch (err) {
        console.error('Error fetching shipping settings:', err);
        setError(err instanceof Error ? err.message : "Failed to load shipping settings");
        toast.error("Failed to load shipping settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchShippingSettings();
  }, [form]);

  // Handle form submission
  const onSubmit = async (data: ShippingSettingsFormValues) => {
    try {
      setIsSaving(true);
      setError(null);
      
      const response = await fetch('/api/settings/shipping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          defaultProvider: data.defaultProvider,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update shipping settings: ${response.status}`);
      }

      const result = await response.json();
      setDefaultProvider(result.defaultProvider);
      toast.success(`Default shipping provider updated to ${result.defaultProvider}`);
    } catch (err) {
      console.error('Error updating shipping settings:', err);
      setError(err instanceof Error ? err.message : "Failed to update shipping settings");
      toast.error("Failed to update shipping settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Shipping Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure shipping providers and options
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="providers">
        <TabsList>
          <TabsTrigger value="providers">Shipping Providers</TabsTrigger>
        </TabsList>
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Provider</CardTitle>
              <CardDescription>
                Choose which shipping provider to use by default for all shipments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Loading shipping providers...</span>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="defaultProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Shipping Provider</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a provider" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableProviders.map((provider) => (
                                <SelectItem 
                                  key={provider} 
                                  value={provider}
                                  className="flex items-center"
                                >
                                  <div className="flex items-center">
                                    <Truck className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span>{provider}</span>
                                    {provider === defaultProvider && (
                                      <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            This provider will be used when no specific provider is selected
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Provider Status</CardTitle>
              <CardDescription>
                View the status and configuration of your shipping providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {availableProviders.map((provider) => (
                    <div
                      key={provider}
                      className={`p-4 rounded-lg border ${
                        provider === defaultProvider
                          ? "border-green-200 bg-green-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Truck className="h-5 w-5 text-muted-foreground" />
                          <h3 className="ml-2 font-medium">{provider}</h3>
                        </div>
                        {provider === defaultProvider && (
                          <span className="inline-flex items-center text-xs font-medium text-green-700 bg-green-100 rounded-full px-2.5 py-0.5">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {provider === "DHL" && "DHL Express shipping services"}
                        {provider === "FedEx" && "FedEx shipping integration"}
                        {provider === "GLS" && "GLS parcel delivery services"}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Status: 
                        <span className={`ml-1 font-medium ${provider === 'FedEx' ? 'text-yellow-600' : 'text-green-600'}`}>
                          {provider === 'FedEx' ? 'Authentication Issues' : 'Configured'}
                        </span>
                      </p>
                      {provider === 'FedEx' && (
                        <p className="mt-1 text-xs text-yellow-600">
                          API credentials may be invalid or missing
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}