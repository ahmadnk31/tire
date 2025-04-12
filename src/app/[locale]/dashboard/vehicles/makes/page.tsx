"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Car, Plus, Pencil, Trash2, ArrowLeft, Upload, AlertCircle } from "lucide-react";

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
import { FileUpload } from "@/components/file-upload";

interface UploadedFile {
  fileUrl: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

interface VehicleMake {
  id: string;
  name: string;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function VehicleMakesPage() {
  const router = useRouter();
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [newMake, setNewMake] = useState({ name: "", logoUrl: "" });
  const [newMakeLogo, setNewMakeLogo] = useState<UploadedFile[]>([]);
  const [editMake, setEditMake] = useState<VehicleMake | null>(null);
  const [editMakeLogo, setEditMakeLogo] = useState<UploadedFile[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Fetch all vehicle makes
  useEffect(() => {
    const fetchMakes = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/vehicle-makes');
        if (!response.ok) {
          throw new Error('Failed to fetch vehicle makes');
        }
        
        const data = await response.json();
        setMakes(data);
      } catch (error) {
        console.error('Error fetching vehicle makes:', error);
        setError('Failed to load vehicle makes. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMakes();
  }, []);
  
  // Handle creating a new vehicle make
  const handleCreateMake = async () => {
    setFormError(null);
    
    if (!newMake.name.trim()) {
      setFormError('Make name is required');
      return;
    }
    
    try {
      const response = await fetch('/api/vehicle-makes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMake),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create vehicle make');
      }
      
      const data = await response.json();
      setMakes([...makes, data]);
      setNewMake({ name: "", logoUrl: "" });
      router.refresh();
    } catch (error: any) {
      console.error('Error creating vehicle make:', error);
      setFormError(error.message || 'Failed to create vehicle make');
    }
  };
  
  // Handle updating a vehicle make
  const handleUpdateMake = async () => {
    setFormError(null);
    
    if (!editMake || !editMake.name.trim()) {
      setFormError('Make name is required');
      return;
    }
    
    try {
      const response = await fetch(`/api/vehicle-makes/${editMake.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editMake.name,
          logoUrl: editMake.logoUrl,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update vehicle make');
      }
      
      const updatedMake = await response.json();
      
      setMakes(makes.map(make => 
        make.id === updatedMake.id ? updatedMake : make
      ));
      
      setEditMake(null);
      router.refresh();
    } catch (error: any) {
      console.error('Error updating vehicle make:', error);
      setFormError(error.message || 'Failed to update vehicle make');
    }
  };
  
  // Handle deleting a vehicle make
  const handleDeleteMake = async () => {
    if (!deleteId) return;
    
    try {
      const response = await fetch(`/api/vehicle-makes/${deleteId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete vehicle make');
      }
      
      setMakes(makes.filter(make => make.id !== deleteId));
      setDeleteId(null);
      router.refresh();
    } catch (error: any) {
      console.error('Error deleting vehicle make:', error);
      alert(error.message || 'Failed to delete vehicle make');
    }
  };
  
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/vehicles" className="flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" />
          <span>Back</span>
        </Link>
        <div className="ml-auto">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Make
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Vehicle Make</DialogTitle>
                <DialogDescription>
                  Add a new vehicle manufacturer or brand.
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
                  <Label htmlFor="name">Make Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Toyota, Honda, Ford"
                    value={newMake.name}
                    onChange={(e) => setNewMake({ ...newMake, name: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Logo Image</Label>
                  <FileUpload 
                    multiple={false}
                    value={newMakeLogo}
                    folder="vehicle-makes"
                    allowedTypes={['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']}
                    onChange={(files) => {
                      setNewMakeLogo(files);
                      if (files.length > 0) {
                        setNewMake({ ...newMake, logoUrl: files[0].fileUrl });
                      } else {
                        setNewMake({ ...newMake, logoUrl: "" });
                      }
                    }}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleCreateMake}>Create Make</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Vehicle Makes</h1>
        <p className="text-muted-foreground text-sm">
          Manage car manufacturers and brands for the tire finder.
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>All Vehicle Makes</CardTitle>
          <CardDescription>
            Vehicle makes are the manufacturers or brands that produce vehicles.
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
          ) : makes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Car className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No Vehicle Makes</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Add your first vehicle make to get started with the tire finder.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Make
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
                  <TableHead>Logo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Models</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {makes.map((make) => (
                  <TableRow key={make.id}>
                    <TableCell>
                      {make.logoUrl ? (
                        <div className="relative h-10 w-10">
                          <Image
                            src={make.logoUrl}
                            alt={make.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                          <Car className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{make.name}</TableCell>
                    <TableCell>
                      <Button
                        variant="link"
                        asChild
                        className="p-0"
                      >
                        <Link href={`/dashboard/vehicles/models?makeId=${make.id}`}>
                          View Models
                        </Link>
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setEditMake(make);
                                // Initialize editMakeLogo with the existing logo if available
                                if (make.logoUrl) {
                                  setEditMakeLogo([{
                                    fileUrl: make.logoUrl,
                                    name: make.name + " logo",
                                    size: 0, // We don't know the size of existing logos
                                    type: "image/png", // Default type
                                    lastModified: Date.now()
                                  }]);
                                } else {
                                  setEditMakeLogo([]);
                                }
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Vehicle Make</DialogTitle>
                              <DialogDescription>
                                Update the details for this vehicle make.
                              </DialogDescription>
                            </DialogHeader>
                            
                            {formError && (
                              <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{formError}</AlertDescription>
                              </Alert>
                            )}
                            
                            {editMake && (
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="edit-name">Make Name</Label>
                                  <Input
                                    id="edit-name"
                                    value={editMake.name}
                                    onChange={(e) => setEditMake({ ...editMake, name: e.target.value })}
                                  />
                                </div>
                                
                                <div className="grid gap-2">
                                  <Label>Logo Image</Label>
                                  <FileUpload 
                                    multiple={false}
                                    value={editMakeLogo}
                                    folder="vehicle-makes"
                                    allowedTypes={['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']}
                                    onChange={(files) => {
                                      setEditMakeLogo(files);
                                      if (files.length > 0) {
                                        setEditMake({ ...editMake, logoUrl: files[0].fileUrl });
                                      } else {
                                        setEditMake({ ...editMake, logoUrl: null });
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                            
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <Button onClick={handleUpdateMake}>Save Changes</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteId(make.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Vehicle Make</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete "{make.name}"? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <p className="py-4 text-sm text-muted-foreground">
                              Note: You cannot delete a vehicle make that has models associated with it.
                              Please delete all models first or reassign them to another make.
                            </p>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <Button
                                variant="destructive"
                                onClick={handleDeleteMake}
                              >
                                Delete Make
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