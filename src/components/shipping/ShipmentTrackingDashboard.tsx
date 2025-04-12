'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrackingStatus } from "@/lib/shipping/shipping-interfaces";

type ShipmentTrackingInfo = {
  trackingNumber: string;
  provider: string;
  status: TrackingStatus;
  estimatedDelivery?: string;
  fromAddress: string;
  toAddress: string;
  lastUpdate?: string;
  progressPercentage: number;
};

// Map tracking status to a human-readable label and color
const statusConfig: Record<TrackingStatus, { label: string; color: string }> = {
  [TrackingStatus.CREATED]: { label: 'Created', color: 'bg-slate-500' },
  [TrackingStatus.PICKED_UP]: { label: 'Picked Up', color: 'bg-blue-500' },
  [TrackingStatus.IN_TRANSIT]: { label: 'In Transit', color: 'bg-amber-500' },
  [TrackingStatus.OUT_FOR_DELIVERY]: { label: 'Out for Delivery', color: 'bg-purple-500' },
  [TrackingStatus.DELIVERED]: { label: 'Delivered', color: 'bg-green-500' },
  [TrackingStatus.EXCEPTION]: { label: 'Exception', color: 'bg-red-500' },
  [TrackingStatus.UNKNOWN]: { label: 'Unknown', color: 'bg-gray-500' }
};

// Map tracking status to progress percentage
const statusToProgress: Record<TrackingStatus, number> = {
  [TrackingStatus.CREATED]: 10,
  [TrackingStatus.PICKED_UP]: 25,
  [TrackingStatus.IN_TRANSIT]: 50,
  [TrackingStatus.OUT_FOR_DELIVERY]: 75,
  [TrackingStatus.DELIVERED]: 100,
  [TrackingStatus.EXCEPTION]: 0,
  [TrackingStatus.UNKNOWN]: 0
};

export default function ShipmentTrackingDashboard({ 
  orderId 
}: { 
  orderId?: string 
}) {
  const [activeTab, setActiveTab] = useState('all');
  const [shipments, setShipments] = useState<ShipmentTrackingInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch shipments from the API
  useEffect(() => {
    async function fetchShipments() {
      setLoading(true);
      setError(null);

      try {
        // Adjust the URL based on whether orderId is provided
        const url = orderId 
          ? `/api/shipping/tracking?orderId=${orderId}`
          : '/api/shipping/tracking/recent';
          
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Error fetching tracking data: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Format the data for display
        const formattedShipments = data.map((shipment: any) => ({
          trackingNumber: shipment.trackingNumber,
          provider: shipment.provider,
          status: shipment.status,
          estimatedDelivery: shipment.estimatedDeliveryDate
            ? new Date(shipment.estimatedDeliveryDate).toLocaleDateString()
            : 'Not available',
          fromAddress: `${shipment.origin.city}, ${shipment.origin.countryCode}`,
          toAddress: `${shipment.destination.city}, ${shipment.destination.countryCode}`,
          lastUpdate: shipment.lastUpdated 
            ? new Date(shipment.lastUpdated).toLocaleString()
            : 'Not available',
          progressPercentage: statusToProgress[shipment.status as TrackingStatus] || 0
        }));
        
        setShipments(formattedShipments);
      } catch (err) {
        console.error('Error fetching shipment tracking:', err);
        setError('Could not load tracking information. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchShipments();
    
    // Auto-refresh tracking data every 5 minutes
    const intervalId = setInterval(fetchShipments, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [orderId]);
  
  // Filter shipments based on active tab
  const filteredShipments = activeTab === 'all' 
    ? shipments 
    : shipments.filter(shipment => 
        activeTab === 'delivered' 
          ? shipment.status === TrackingStatus.DELIVERED 
          : shipment.status !== TrackingStatus.DELIVERED
      );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipment Tracking</CardTitle>
        <CardDescription>
          {orderId 
            ? `Tracking information for order #${orderId}`
            : 'Recent shipment tracking information'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Shipments</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            {loading && <p>Loading tracking information...</p>}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
                {error}
              </div>
            )}
            
            {!loading && !error && filteredShipments.length === 0 && (
              <p className="text-muted-foreground">No shipments found.</p>
            )}
            
            {!loading && !error && filteredShipments.length > 0 && (
              <div className="space-y-4">
                {filteredShipments.map(shipment => (
                  <div 
                    key={shipment.trackingNumber}
                    className="border rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Tracking Number: <span className="font-medium text-foreground">{shipment.trackingNumber}</span>
                        </p>
                        <p className="mt-1 font-semibold">{shipment.fromAddress} → {shipment.toAddress}</p>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <Badge className={statusConfig[shipment.status].color}>
                          {statusConfig[shipment.status].label}
                        </Badge>
                        <span className="text-xs text-muted-foreground mt-1">
                          via {shipment.provider}
                        </span>
                      </div>
                    </div>
                    
                    <Progress 
                      value={shipment.progressPercentage} 
                      className="mt-3" 
                    />
                    
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>Estimated Delivery: {shipment.estimatedDelivery}</span>
                      <span>Last Update: {shipment.lastUpdate}</span>
                    </div>
                    
                    <div className="mt-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`/tracking/${shipment.trackingNumber}`, '_blank')}
                      >
                        Detailed View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}