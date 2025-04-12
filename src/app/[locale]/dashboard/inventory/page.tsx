"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, PlusCircle, Loader2, Package, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { InventoryForm } from "./components/inventory-form";

export default function InventoryPage() {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const response = await fetch("/api/locations");
      if (!response.ok) {
        throw new Error("Failed to fetch locations");
      }
      return response.json();
    },
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      return response.json();
    },
  });

  const handleOpenForm = () => {
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleLocationSelect = (locationId: string) => {
    router.push(`/dashboard/inventory/${locationId}`);
  };

  return (
    <DashboardShell>
      <DashboardHeader heading="Inventory Management" description="Manage your inventory across locations">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/locations")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Manage Locations
          </Button>
        </div>
      </DashboardHeader>

      {locationsLoading ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Loading locations...</p>
          </CardContent>
        </Card>
      ) : locations.length === 0 ? (
        <EmptyState
          image="/images/empty-state.png"
          title="No locations found"
          description="You need to create a location before managing inventory."
          action={
            <Button onClick={() => router.push("/dashboard/locations")}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Select a Location to Manage Inventory</CardTitle>
            <CardDescription>
              Choose a location to view and manage its inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.filter(location => location.isActive).map((location: any) => (
                <Card key={location.id} className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleLocationSelect(location.id)}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{location.name}</CardTitle>
                    <Badge className="w-fit">
                      {location.type === "WAREHOUSE" ? "Warehouse" :
                        location.type === "STORE" ? "Store" :
                          location.type === "SUPPLIER" ? "Supplier" :
                            location.type === "CUSTOMER" ? "Customer" : "Other"}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {location.address && location.city ?
                        `${location.address}, ${location.city}, ${location.state}` :
                        "No address provided"}
                    </p>
                    <Button className="mt-4 w-full" size="sm">
                      Manage Inventory
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  );
}