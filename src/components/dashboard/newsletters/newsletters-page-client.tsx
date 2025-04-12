"use client"

import { useState } from "react"
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { NewslettersList } from "./newsletters-list"
import { CreateNewsletterForm } from "./create-newsletter-form"
import { SubscribersList } from "./subscribers-list"
import { NewsletterStats } from "./newsletter-stats"

export default function NewslettersPageClient() {
  const [activeTab, setActiveTab] = useState("newsletters")

  return (
    <div className="container mx-auto">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Newsletter Management</h1>
        <p className="text-muted-foreground">
          Create, schedule, and manage newsletter campaigns for your customers.
        </p>

        <NewsletterStats />

        <Tabs defaultValue="newsletters" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="newsletters">Newsletters</TabsTrigger>
            <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
          </TabsList>
          
          <TabsContent value="newsletters" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Newsletter Campaigns</CardTitle>
                <CardDescription>
                  View and manage your newsletter campaigns.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NewslettersList />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="subscribers" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscribers</CardTitle>
                <CardDescription>
                  Manage your newsletter subscribers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubscribersList />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="create" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Newsletter</CardTitle>
                <CardDescription>
                  Create a new newsletter campaign.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreateNewsletterForm onSuccess={() => setActiveTab("newsletters")} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
