import { Metadata } from "next";
import Link from "next/link";
import { Car, ChevronRight, CalendarDays, ListTree, Tag } from "lucide-react";
import { prisma } from "@/lib/db";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Vehicle Management | Dashboard",
  description: "Manage vehicle makes, models, and tire fitments",
};

// Use server-side data fetching for the vehicle stats


export default async function VehiclesPage() {
  // Fetch real data from the database using Prisma
  const [totalMakes, totalModels, totalYears, totalFitments] = await Promise.all([
    prisma.vehicleMake.count(),
    prisma.vehicleModel.count(),
    prisma.vehicleYear.count(),
    prisma.vehicleTire.count(),
  ]);

  const stats = {
    totalMakes,
    totalModels,
    totalFitments,
    totalYears,
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Vehicle Management</h1>
        <p className="text-muted-foreground text-sm">
          Manage vehicle makes, models, years, and tire compatibility data for the tire finder.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Makes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.totalMakes}</div>
              <ListTree className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.totalModels}</div>
              <Car className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Years</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.totalYears}</div>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Fitments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.totalFitments}</div>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />
      
      <h2 className="text-xl font-semibold">Management Options</h2>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/vehicles/makes">
          <Card className="h-full overflow-hidden border transition-colors hover:border-primary hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <ListTree className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl">Vehicle Makes</CardTitle>
                <CardDescription>
                  Manage car manufacturers
                </CardDescription>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add, edit, and delete vehicle makes like Toyota, Honda, Ford, etc.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/vehicles/models">
          <Card className="h-full overflow-hidden border transition-colors hover:border-primary hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Car className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl">Vehicle Models</CardTitle>
                <CardDescription>
                  Manage vehicle models
                </CardDescription>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add, edit, and delete vehicle models like Camry, Accord, F-150, etc.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/vehicles/years">
          <Card className="h-full overflow-hidden border transition-colors hover:border-primary hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl">Vehicle Years</CardTitle>
                <CardDescription>
                  Manage model years
                </CardDescription>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure the available years for each model and the variations between model years.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/vehicles/fitments">
          <Card className="h-full overflow-hidden border transition-colors hover:border-primary hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Tag className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl">Tire Fitments</CardTitle>
                <CardDescription>
                  Manage tire compatibility
                </CardDescription>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create associations between tires and vehicles to enable the tire finder functionality.
                Specify OEM and aftermarket fitments.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}