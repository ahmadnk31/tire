"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle, Pencil, Trash2, Loader2 } from "lucide-react";
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

import { ModelForm } from "./components/model-form";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";

export default function ModelsPage() {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const { data: models, isLoading, refetch } = useQuery({
    queryKey: ["models"],
    queryFn: async () => {
      const response = await fetch("/api/models");
      if (!response.ok) {
        throw new Error("Failed to fetch models");
      }
      return response.json();
    },
  });

  const handleOpenForm = (model?: any) => {
    setSelectedModel(model || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedModel(null);
    refetch();
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(id);
      const response = await fetch(`/api/models/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete model");
      }

      toast.success("Model deleted successfully");
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Models"
        description="Manage tire models for your brands"
      >
        <Button onClick={() => handleOpenForm()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Model
        </Button>
      </DashboardHeader>

      <div>
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : models?.length ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {models.map((model: any) => (
                    <TableRow key={model.id}>
                      <TableCell className="font-medium">{model.name}</TableCell>
                      <TableCell>{model.brand.name}</TableCell>
                      <TableCell className="max-w-48 truncate">
                        {model.description || "—"}
                      </TableCell>
                      <TableCell>
                        {new Date(model.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenForm(model)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Model</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this model? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(model.id)}
                                  disabled={isDeleting === model.id}
                                >
                                  {isDeleting === model.id && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  )}
                                  Delete
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
        ) : (
          <EmptyState
            title="No models found"
            description="You haven't added any models yet. Add one below."
            action={
              <Button onClick={() => handleOpenForm()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Model
              </Button>
            }
          />
        )}
      </div>

      {isFormOpen && (
        <ModelForm
          initialData={selectedModel}
          onClose={handleCloseForm}
        />
      )}
    </DashboardShell>
  );
}