"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Car, Plus, Pencil, Trash2, ArrowLeft, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogClose
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VehicleMake {
  id: string;
  name: string;
  logoUrl: string | null;
}

interface VehicleModel {
  id: string;
  name: string;
  makeId: string;
  make: VehicleMake;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function VehicleModelsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const makeIdParam = searchParams.get("makeId");
  
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [selectedMake, setSelectedMake] = useState<VehicleMake | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [newModel, setNewModel] = useState({ name: "", makeId: makeIdParam || "", description: "" });
  const [editModel, setEditModel] = useState<VehicleModel | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Fetch all vehicle makes
  useEffect(() => {
    const fetchMakes = async () => {
      try {
        const response = await fetch('/api/vehicle-makes');
        if (!response.ok) {
          throw new Error('Failed to fetch vehicle makes');
        }
        
        const data = await response.json();
        setMakes(data);
        
        // If a makeId is provided in the URL, find the corresponding make
        if (makeIdParam) {
          const make = data.find((make: VehicleMake) => make.id === makeIdParam);
          if (make) {
            setSelectedMake(make);
          }
        }
      } catch (error) {
        console.error('Error fetching vehicle makes:', error);
        setError('Failed to load vehicle makes. Please try again.');
      }
    };
    
    fetchMakes();
  }, [makeIdParam]);
  
  // Fetch vehicle models based on selected make
  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const url = selectedMake 
          ? `/api/vehicle-models?makeId=${selectedMake.id}` 
          : '/api/vehicle-models';
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch vehicle models');
        }
        
        const data = await response.json();
        setModels(data);
      } catch (error) {
        console.error('Error fetching vehicle models:', error);
        setError('Failed to load vehicle models. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchModels();
  }, [selectedMake]);
  
  // Handle selecting a different make
  const handleMakeChange = (makeId: string) => {
    const make = makes.find(m => m.id === makeId);
    setSelectedMake(make || null);
    setNewModel({ ...newModel, makeId });
    
    // Update URL without refreshing the page
    if (make) {
      router.push(`/dashboard/vehicles/models?makeId=${makeId}`);
    } else {
      router.push('/dashboard/vehicles/models');
    }
  };
  
  // Handle creating a new vehicle model
  const handleCreateModel = async () => {
    setFormError(null);
    
    if (!newModel.name.trim()) {
      setFormError('Model name is required');
      return;
    }
    
    if (!newModel.makeId) {
      setFormError('Please select a make for this model');
      return;
    }
    
    try {
      const response = await fetch('/api/vehicle-models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newModel),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create vehicle model');
      }
      
      const data = await response.json();
      setModels([...models, data]);
      setNewModel({ ...newModel, name: "", description: "" });
      router.refresh();
    } catch (error: any) {
      console.error('Error creating vehicle model:', error);
      setFormError(error.message || 'Failed to create vehicle model');
    }
  };
  
  // Handle updating a vehicle model
  const handleUpdateModel = async () => {
    setFormError(null);
    
    if (!editModel || !editModel.name.trim()) {
      setFormError('Model name is required');
      return;
    }
    
    try {
      const response = await fetch(`/api/vehicle-models/${editModel.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editModel.name,
          description: editModel.description,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update vehicle model');
      }
      
      const updatedModel = await response.json();
      
      setModels(models.map(model => 
        model.id === updatedModel.id ? updatedModel : model
      ));
      
      setEditModel(null);
      router.refresh();
    } catch (error: any) {
      console.error('Error updating vehicle model:', error);
      setFormError(error.message || 'Failed to update vehicle model');
    }
  };
  
  // Handle deleting a vehicle model
  const handleDeleteModel = async () => {
    if (!deleteId) return;
    
    try {
      const response = await fetch(`/api/vehicle-models/${deleteId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete vehicle model');
      }
      
      setModels(models.filter(model => model.id !== deleteId));
      setDeleteId(null);
      router.refresh();
    } catch (error: any) {
      console.error('Error deleting vehicle model:', error);
      alert(error.message || 'Failed to delete vehicle model');
    }
  };
  
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/vehicles" className="flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" />
          <span>Back to Vehicle Management</span>
        </Link>
        <div className="ml-auto">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Model
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Vehicle Model</DialogTitle>
                <DialogDescription>
                  Add a new vehicle model for a specific manufacturer.
                </DialogDescription>
              </DialogHeader>
              
              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="make">Vehicle Make</Label>
                  <Select
                    value={newModel.makeId}
                    onValueChange={(value) => setNewModel({ ...newModel, makeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a manufacturer" />
                    </SelectTrigger>
                    <SelectContent>
                      {makes.map((make) => (
                        <SelectItem key={make.id} value={make.id}>
                          {make.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="name">Model Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Camry, Accord, F-150"
                    value={newModel.name}
                    onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="Brief description of the vehicle model"
                    value={newModel.description}
                    onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleCreateModel}>Create Model</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Vehicle Models</h1>
        <p className="text-muted-foreground text-sm">
          Manage vehicle models for the tire finder.
        </p>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter by Make</CardTitle>
          <CardDescription>
            Select a vehicle make to view its models.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedMake?.id || ""}
            onValueChange={handleMakeChange}
          >
            <SelectTrigger className="w-full md:w-1/2">
              <SelectValue placeholder="View all makes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">All Makes</SelectItem>
              {makes.map((make) => (
                <SelectItem key={make.id} value={make.id}>
                  {make.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedMake ? `Models for ${selectedMake.name}` : 'All Vehicle Models'}
          </CardTitle>
          <CardDescription>
            Vehicle models are specific car models produced by manufacturers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : models.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Car className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">
                {selectedMake 
                  ? `No models found for ${selectedMake.name}` 
                  : 'No vehicle models found'}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {selectedMake 
                  ? `Add your first model for ${selectedMake.name}` 
                  : 'Add your first vehicle model to get started'}
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Model
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  {/* Same content as the add dialog above */}
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model Name</TableHead>
                  <TableHead>Make</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell className="font-medium">{model.name}</TableCell>
                    <TableCell>{model.make.name}</TableCell>
                    <TableCell>{model.description || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setEditModel(model)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Vehicle Model</DialogTitle>
                              <DialogDescription>
                                Update the details for this vehicle model.
                              </DialogDescription>
                            </DialogHeader>
                            
                            {formError && (
                              <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{formError}</AlertDescription>
                              </Alert>
                            )}
                            
                            {editModel && (
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label>Vehicle Make</Label>
                                  <Input
                                    value={editModel.make.name}
                                    disabled
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    To change the make, please delete this model and create a new one.
                                  </p>
                                </div>
                                
                                <div className="grid gap-2">
                                  <Label htmlFor="edit-name">Model Name</Label>
                                  <Input
                                    id="edit-name"
                                    value={editModel.name}
                                    onChange={(e) => setEditModel({ ...editModel, name: e.target.value })}
                                  />
                                </div>
                                
                                <div className="grid gap-2">
                                  <Label htmlFor="edit-description">Description</Label>
                                  <Input
                                    id="edit-description"
                                    value={editModel.description || ""}
                                    onChange={(e) => setEditModel({ ...editModel, description: e.target.value })}
                                  />
                                </div>
                              </div>
                            )}
                            
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <Button onClick={handleUpdateModel}>Save Changes</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteId(model.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Vehicle Model</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete "{model.name}"? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <p className="py-4 text-sm text-muted-foreground">
                              Note: You cannot delete a vehicle model that has trims or tire fitments associated with it.
                            </p>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <Button
                                variant="destructive"
                                onClick={handleDeleteModel}
                              >
                                Delete Model
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}