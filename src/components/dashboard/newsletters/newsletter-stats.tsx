"use client"

import { useQuery } from "@tanstack/react-query"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Mail, Users, Send, BarChart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

// API function to fetch newsletter stats
const fetchNewsletterStats = async () => {
  const response = await fetch('/api/newsletters/stats');
  if (!response.ok) {
    throw new Error('Failed to fetch newsletter statistics');
  }
  return response.json();
};

export function NewsletterStats() {
  // Fetch stats with React Query
  const { 
    data: stats,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['newsletterStats'],
    queryFn: fetchNewsletterStats
  })
  // Handle error state
  if (isError) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-500">Error loading newsletter statistics: {(error as Error).message}</p>
        <Button 
          onClick={() => refetch()}
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Create a loading state for the cards
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="flex items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </Card>
        ))}
      </div>
    );
  }

  // Safely access stats with defaults in case of partial data
  const totalSubscribers = stats?.totalSubscribers ?? 0;
  const openRate = stats?.openRate ?? 0;
  const sentCampaigns = stats?.sentCampaigns ?? 0;
  const clickRate = stats?.clickRate ?? 0;
  const growth = stats?.growth || {
    subscribers: 0,
    openRate: 0,
    campaigns: 0,
    clickRate: 0
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSubscribers.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {growth.subscribers > 0 ? `+${growth.subscribers}` : growth.subscribers} from last month
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{openRate}%</div>
          <p className="text-xs text-muted-foreground">
            {growth.openRate > 0 ? `+${growth.openRate}%` : `${growth.openRate}%`} from last month
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sent Campaigns</CardTitle>
          <Send className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{sentCampaigns}</div>
          <p className="text-xs text-muted-foreground">
            {growth.campaigns > 0 ? `+${growth.campaigns}` : growth.campaigns} from last month
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
          <BarChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{clickRate}%</div>
          <p className="text-xs text-muted-foreground">
            {growth.clickRate > 0 ? `+${growth.clickRate}%` : `${growth.clickRate}%`} from last month
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
