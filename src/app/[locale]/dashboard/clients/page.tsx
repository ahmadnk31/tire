"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle, Pencil, Trash2, Loader2, User, Shield, Store } from "lucide-react";
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
import { ClientForm } from "./components/client-form";

export default function ClientsPage() {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<any>(null);

  // Fetch clients data using React Query
  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const response = await fetch("/api/user");
      if (!response.ok) {
        throw new Error("Failed to load clients");
      }
      return await response.json();
    },
  });

  // Delete client handler
  const handleDeleteClient = async (clientId: string) => {
    try {
      const response = await fetch(`/api/user/${clientId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete client");
      }

      toast.success("Client deleted successfully");
      refetch(); // Refresh the clients list
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Failed to delete client");
    }
  };

  // Helper to get role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge className="bg-red-500 hover:bg-red-600"><Shield className="mr-1 h-3 w-3" /> Admin</Badge>;
      case "RETAILER":
        return <Badge className="bg-blue-500 hover:bg-blue-600"><Store className="mr-1 h-3 w-3" /> Retailer</Badge>;
      default:
        return <Badge className="bg-green-500 hover:bg-green-600"><User className="mr-1 h-3 w-3" /> User</Badge>;
    }
  };

  return (
    <DashboardShell>
      <DashboardHeader heading="Client Management" description="Manage your platform users">
        <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </DashboardHeader>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Clients</CardTitle>
            <CardDescription>
              View and manage all clients registered on your platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[200px] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : clients?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client: any) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{getRoleBadge(client.role)}</TableCell>
                      <TableCell>{new Date(client.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setCurrentClient(client);
                            setIsUpdateModalOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this client and all associated data.
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-500 hover:bg-red-600"
                                onClick={() => handleDeleteClient(client.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                image="/empty-state.svg"
                title="No clients found"
                description="You haven't added any clients yet or none match your search criteria."
                action={
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Client
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Client Dialog */}
      <ClientForm
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={() => {
          refetch();
          setIsCreateModalOpen(false);
        }}
      />

      {/* Update Client Dialog */}
      {currentClient && (
        <ClientForm
          open={isUpdateModalOpen}
          onOpenChange={setIsUpdateModalOpen}
          client={currentClient}
          onSuccess={() => {
            refetch();
            setIsUpdateModalOpen(false);
            setCurrentClient(null);
          }}
        />
      )}
    </DashboardShell>
  );
}