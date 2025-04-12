"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle, Pencil, Trash2, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { LocationForm } from "./components/location-form";

export default function LocationsPage() {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const { data: locations = [], isLoading, refetch } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const response = await fetch("/api/locations");
      if (!response.ok) {
        throw new Error("Failed to fetch locations");
      }
      return response.json();
    },
  });

  const handleOpenForm = (location?: any) => {
    setSelectedLocation(location || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedLocation(null);
    refetch();
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(id);
      const response = await fetch(`/api/locations/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Location deleted successfully");
        refetch();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to delete location");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the location");
    } finally {
      setIsDeleting(null);
    }
  };

  const getLocationTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      "WAREHOUSE": "Warehouse",
      "STORE": "Store",
      "SUPPLIER": "Supplier",
      "CUSTOMER": "Customer",
      "OTHER": "Other"
    };
    
    return types[type] || type;
  };

  return (
    <DashboardShell>
      <DashboardHeader heading="Locations" description="Manage your inventory locations">
        <Button onClick={() => handleOpenForm()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Location
        </Button>
      </DashboardHeader>
      <div>
        {isLoading ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Loading locations...</p>
            </CardContent>
          </Card>
        ) : locations.length === 0 ? (
          <EmptyState
            image="/empty-state.svg"
            title="No locations found"
            description="Get started by creating a new location."
            action={
              <Button onClick={() => handleOpenForm()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Your First Location
              </Button>
            }
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Your Locations</CardTitle>
              <CardDescription>
                {locations.length} {locations.length === 1 ? "location" : "locations"} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((location: any) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">{location.name}</TableCell>
                      <TableCell>{getLocationTypeLabel(location.type)}</TableCell>
                      <TableCell>
                        {location.address && location.city 
                          ? `${location.address}, ${location.city}, ${location.state} ${location.postalCode}` 
                          : "No address provided"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={location.isActive ? "default" : "secondary"}>
                          {location.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/inventory/${location.id}`)}
                          >
                            Manage Inventory
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenForm(location)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Location</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this location? This action cannot be undone and will also 
                                  remove all inventory associated with this location.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDelete(location.id);
                                  }}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {isDeleting === location.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Delete"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {isFormOpen && (
        <LocationForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          location={selectedLocation}
        />
      )}
    </DashboardShell>
  );
}