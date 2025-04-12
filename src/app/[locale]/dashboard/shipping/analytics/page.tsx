'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/dashboard/shared/date-range-picker"; // You'll need to create this component
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { ApiEventType } from '@/lib/utils/api-usage-tracker';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Provider colors for consistency
const providerColors = {
  DHL: 'rgba(249, 197, 15, 0.7)',
  FedEx: 'rgba(76, 104, 215, 0.7)',
  GLS: 'rgba(0, 163, 224, 0.7)',
};

type ApiUsageData = {
  provider: string;
  count: number;
  successCount: number;
  failureCount: number;
  averageLatency: number;
  eventTypes: Record<string, number>;
  endpoints: Record<string, number>;
  dailyUsage: Record<string, number>;
  successRate: number;
};

type DateRange = {
  from: Date;
  to: Date;
};

export default function ShippingAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [apiData, setApiData] = useState<ApiUsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    to: new Date()
  });
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  
  // Fetch API usage data
  useEffect(() => {
    async function fetchApiUsageData() {
      setLoading(true);
      setError(null);

      try {
        // Format dates for the API
        const fromDate = dateRange.from.toISOString().split('T')[0];
        const toDate = dateRange.to.toISOString().split('T')[0];
        
        // Build URL with query params
        const url = `/api/dashboard/shipping/analytics?from=${fromDate}&to=${toDate}${
          selectedProvider !== 'all' ? `&provider=${selectedProvider}` : ''
        }`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch API usage data: ${response.status}`);
        }
        
        const data = await response.json();
        setApiData(data);
      } catch (err) {
        console.error('Error fetching API usage data:', err);
        setError('Could not load API usage data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchApiUsageData();
  }, [dateRange, selectedProvider]);
  
  // Chart data for API calls by provider
  const providerChartData = {
    labels: apiData.map(provider => provider.provider),
    datasets: [
      {
        label: 'Total API Calls',
        data: apiData.map(provider => provider.count),
        backgroundColor: Object.values(providerColors),
        borderWidth: 1,
      },
    ],
  };
  
  // Chart data for success rates
  const successRateChartData = {
    labels: apiData.map(provider => provider.provider),
    datasets: [
      {
        label: 'Success Rate (%)',
        data: apiData.map(provider => provider.successRate * 100), // Convert to percentage
        backgroundColor: apiData.map(provider => 
          provider.successRate > 0.95 ? 'rgba(34, 197, 94, 0.7)' : // Green for good
          provider.successRate > 0.9 ? 'rgba(234, 179, 8, 0.7)' : // Yellow for medium
          'rgba(239, 68, 68, 0.7)' // Red for bad
        ),
        borderWidth: 1,
      },
    ],
  };
  
  // Get event type data for the active provider or all providers
  const eventTypeData = apiData.reduce((acc, provider) => {
    Object.entries(provider.eventTypes).forEach(([eventType, count]) => {
      acc[eventType] = (acc[eventType] || 0) + count;
    });
    return acc;
  }, {} as Record<string, number>);
  
  // Chart data for event types
  const eventTypeChartData = {
    labels: Object.keys(eventTypeData),
    datasets: [
      {
        label: 'API Calls by Event Type',
        data: Object.values(eventTypeData),
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Get daily usage data for time series chart
  const combinedDailyUsage: Record<string, number> = {};
  
  apiData.forEach(provider => {
    Object.entries(provider.dailyUsage).forEach(([date, count]) => {
      combinedDailyUsage[date] = (combinedDailyUsage[date] || 0) + count;
    });
  });
  
  // Sort dates for the time series chart
  const sortedDates = Object.keys(combinedDailyUsage).sort();
  
  // Chart data for daily usage
  const dailyUsageChartData = {
    labels: sortedDates,
    datasets: apiData.map(provider => ({
      label: provider.provider,
      data: sortedDates.map(date => provider.dailyUsage[date] || 0),
      backgroundColor: providerColors[provider.provider as keyof typeof providerColors] || 'rgba(107, 114, 128, 0.7)',
      borderColor: providerColors[provider.provider as keyof typeof providerColors] || 'rgba(107, 114, 128, 1)',
      borderWidth: 2,
      fill: false,
      tension: 0.1,
    })),
  };
  
  // Chart data for performance/latency
  const latencyChartData = {
    labels: apiData.map(provider => provider.provider),
    datasets: [
      {
        label: 'Average Response Time (ms)',
        data: apiData.map(provider => provider.averageLatency),
        backgroundColor: apiData.map(provider => 
          provider.averageLatency < 300 ? 'rgba(34, 197, 94, 0.7)' : // Green for good
          provider.averageLatency < 1000 ? 'rgba(234, 179, 8, 0.7)' : // Yellow for medium
          'rgba(239, 68, 68, 0.7)' // Red for bad
        ),
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Shipping API Analytics</h1>
      
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <Select 
          value={selectedProvider} 
          onValueChange={setSelectedProvider}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            <SelectItem value="DHL">DHL</SelectItem>
            <SelectItem value="FedEx">FedEx</SelectItem>
            <SelectItem value="GLS">GLS</SelectItem>
          </SelectContent>
        </Select>
        
        {/* You'll need to implement a DateRangePicker component */}
        <div className="flex-1">
          <DateRangePicker
            from={dateRange.from}
            to={dateRange.to}
            onChange={(event: any) => {
              // Assuming the component passes DateRange in the event or as the first argument
              if (event.from && event.to) {
                setDateRange(event as DateRange);
              }
            }}
          />
        </div>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>
        
        {loading && <p className="text-center py-8">Loading analytics data...</p>}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            {error}
          </div>
        )}
        
        {!loading && !error && (
          <>
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>API Calls by Provider</CardTitle>
                    <CardDescription>Total API calls during selected period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <Bar data={providerChartData} options={{ maintainAspectRatio: false }} />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>API Calls by Event Type</CardTitle>
                    <CardDescription>Distribution of API calls by type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <Bar data={eventTypeChartData} options={{ maintainAspectRatio: false }} />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Daily API Usage</CardTitle>
                  <CardDescription>API calls over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <Line data={dailyUsageChartData} options={{ 
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="usage">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {apiData.map(provider => (
                  <Card key={provider.provider}>
                    <CardHeader>
                      <CardTitle>{provider.provider}</CardTitle>
                      <CardDescription>Usage Statistics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <dl className="divide-y divide-gray-200">
                        <div className="py-2 flex justify-between">
                          <dt className="text-muted-foreground">Total API Calls</dt>
                          <dd className="font-medium">{provider.count}</dd>
                        </div>
                        <div className="py-2 flex justify-between">
                          <dt className="text-muted-foreground">Success Rate</dt>
                          <dd className="font-medium">{(provider.successRate * 100).toFixed(2)}%</dd>
                        </div>
                        <div className="py-2 flex justify-between">
                          <dt className="text-muted-foreground">Average Latency</dt>
                          <dd className="font-medium">{provider.averageLatency.toFixed(2)} ms</dd>
                        </div>
                        <div className="py-2 flex justify-between">
                          <dt className="text-muted-foreground">Rate Quotes</dt>
                          <dd className="font-medium">{provider.eventTypes[ApiEventType.RATE_QUOTE] || 0}</dd>
                        </div>
                        <div className="py-2 flex justify-between">
                          <dt className="text-muted-foreground">Labels Created</dt>
                          <dd className="font-medium">{provider.eventTypes[ApiEventType.CREATE_LABEL] || 0}</dd>
                        </div>
                        <div className="py-2 flex justify-between">
                          <dt className="text-muted-foreground">Tracking Requests</dt>
                          <dd className="font-medium">{provider.eventTypes[ApiEventType.TRACK_SHIPMENT] || 0}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Top API Endpoints</CardTitle>
                  <CardDescription>Most frequently used endpoints</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr>
                          <th className="py-2 px-4">Provider</th>
                          <th className="py-2 px-4">Endpoint</th>
                          <th className="py-2 px-4 text-right">Calls</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apiData.flatMap(provider => 
                          Object.entries(provider.endpoints)
                            .map(([endpoint, count]) => ({
                              provider: provider.provider,
                              endpoint,
                              count
                            }))
                        )
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 10)
                        .map((item, index) => (
                          <tr key={index} className="border-t border-gray-200">
                            <td className="py-2 px-4">{item.provider}</td>
                            <td className="py-2 px-4">{item.endpoint}</td>
                            <td className="py-2 px-4 text-right">{item.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="performance">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Average Response Times</CardTitle>
                  <CardDescription>API latency by provider</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <Bar data={latencyChartData} options={{ 
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Milliseconds (ms)'
                          }
                        }
                      }
                    }} />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Success Rates</CardTitle>
                  <CardDescription>API success rates by provider</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <Bar data={successRateChartData} options={{ 
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          title: {
                            display: true,
                            text: 'Success Rate (%)'
                          }
                        }
                      }
                    }} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="errors">
              <Card>
                <CardHeader>
                  <CardTitle>API Errors</CardTitle>
                  <CardDescription>Recent API errors and failures</CardDescription>
                </CardHeader>
                <CardContent>
                  {apiData.every(provider => provider.failureCount === 0) ? (
                    <p className="text-center py-4">No API errors recorded in the selected period.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      {/* Table to display error information - you'd need to add this data to your API response */}
                      <table className="w-full text-left">
                        <thead>
                          <tr>
                            <th className="py-2 px-4">Provider</th>
                            <th className="py-2 px-4">Error Count</th>
                            <th className="py-2 px-4">Error Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {apiData.map((provider, index) => (
                            <tr key={index} className="border-t border-gray-200">
                              <td className="py-2 px-4">{provider.provider}</td>
                              <td className="py-2 px-4">{provider.failureCount}</td>
                              <td className="py-2 px-4">
                                {((1 - provider.successRate) * 100).toFixed(2)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}