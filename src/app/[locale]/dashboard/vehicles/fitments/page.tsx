"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Car, Plus, Trash2, ArrowLeft, AlertCircle, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Interfaces for our data models
interface VehicleMake {
  id: string;
  name: string;
}

interface VehicleModel {
  id: string;
  name: string;
  makeId: string;
  make: VehicleMake;
}

interface VehicleTrim {
  id: string;
  name: string;
  modelId: string;
  model: VehicleModel;
}

interface VehicleYear {
  id: string;
  year: number;
  trimId: string;
  trim: VehicleTrim;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  brand: {
    name: string;
  };
  model: {
    name: string;
  };
  width: number;
  aspectRatio: number;
  rimDiameter: number;
}

interface VehicleFit {
  id: string;
  vehicleYearId: string;
  productId: string;
  isOEM: boolean;
  vehicleYear: VehicleYear;
  product: Product;
}

export default function TireFitmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for filter parameters
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [trims, setTrims] = useState<VehicleTrim[]>([]);
  const [years, setYears] = useState<VehicleYear[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // State for filters
  const [filters, setFilters] = useState({
    makeId: searchParams.get("makeId") || "",
    modelId: searchParams.get("modelId") || "",
    trimId: searchParams.get("trimId") || "",
    yearId: searchParams.get("yearId") || "",
    productId: "",
    isOEM: false,
  });
  
  // State for fitments
  const [fitments, setFitments] = useState<VehicleFit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Fetch vehicle makes
  useEffect(() => {
    const fetchMakes = async () => {
      try {
        const response = await fetch('/api/vehicle-makes');
        if (!response.ok) throw new Error('Failed to fetch vehicle makes');
        const data = await response.json();
        setMakes(data);
      } catch (error) {
        console.error('Error fetching vehicle makes:', error);
        setError('Failed to load vehicle makes. Please try again.');
      }
    };
    
    fetchMakes();
  }, []);
  
  // Fetch vehicle models when make changes
  useEffect(() => {
    if (!filters.makeId) {
      setModels([]);
      setFilters(prev => ({ ...prev, modelId: "", trimId: "", yearId: "" }));
      return;
    }
    
    const fetchModels = async () => {
      try {
        const response = await fetch(`/api/vehicle-models?makeId=${filters.makeId}`);
        if (!response.ok) throw new Error('Failed to fetch vehicle models');
        const data = await response.json();
        setModels(data);
      } catch (error) {
        console.error('Error fetching vehicle models:', error);
        setError('Failed to load vehicle models. Please try again.');
      }
    };
    
    fetchModels();
  }, [filters.makeId]);
  
  // Fetch vehicle trims when model changes
  useEffect(() => {
    if (!filters.modelId) {
      setTrims([]);
      setFilters(prev => ({ ...prev, trimId: "", yearId: "" }));
      return;
    }
    
    const fetchTrims = async () => {
      try {
        const response = await fetch(`/api/vehicle-trims?modelId=${filters.modelId}`);
        if (!response.ok) throw new Error('Failed to fetch vehicle trims');
        const data = await response.json();
        setTrims(data);
      } catch (error) {
        console.error('Error fetching vehicle trims:', error);
        setError('Failed to load vehicle trims. Please try again.');
      }
    };
    
    fetchTrims();
  }, [filters.modelId]);
  
  // Fetch vehicle years when trim changes
  useEffect(() => {
    if (!filters.trimId) {
      setYears([]);
      setFilters(prev => ({ ...prev, yearId: "" }));
      return;
    }
    
    const fetchYears = async () => {
      try {
        const response = await fetch(`/api/vehicle-years?trimId=${filters.trimId}`);
        if (!response.ok) throw new Error('Failed to fetch vehicle years');
        const data = await response.json();
        setYears(data);
      } catch (error) {
        console.error('Error fetching vehicle years:', error);
        setError('Failed to load vehicle years. Please try again.');
      }
    };
    
    fetchYears();
  }, [filters.trimId]);
  
  // Fetch products for adding fitments
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products?limit=100');
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setProducts(data.products);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    
    fetchProducts();
  }, []);
  
  // Fetch fitments when filters change
  useEffect(() => {
    const fetchFitments = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let url = `/api/vehicle-fitments?page=${page}&limit=${itemsPerPage}`;
        
        if (filters.makeId) url += `&makeId=${filters.makeId}`;
        if (filters.modelId) url += `&modelId=${filters.modelId}`;
        if (filters.trimId) url += `&trimId=${filters.trimId}`;
        if (filters.yearId) url += `&yearId=${filters.yearId}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch fitments');
        
        const data = await response.json();
        setFitments(data.fitments);
        setTotalItems(data.total);
        setTotalPages(Math.ceil(data.total / itemsPerPage));
      } catch (error) {
        console.error('Error fetching fitments:', error);
        setError('Failed to load fitments. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFitments();
  }, [filters.makeId, filters.modelId, filters.trimId, filters.yearId, page]);
  
  // Handle creating a new fitment
  const handleCreateFitment = async () => {
    setFormError(null);
    
    if (!filters.yearId) {
      setFormError('Please select a vehicle year');
      return;
    }
    
    if (!filters.productId) {
      setFormError('Please select a tire product');
      return;
    }
    
    try {
      const response = await fetch('/api/vehicle-fitments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleYearId: filters.yearId,
          productId: filters.productId,
          isOEM: filters.isOEM,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create fitment');
      }
      
      // Refresh the fitments list
      const updatedFilters = { ...filters };
      setFilters(updatedFilters);
      
      // Reset product selection
      setFilters(prev => ({ ...prev, productId: "" }));
      
      // Show success message or update UI
      alert('Tire fitment added successfully!');
    } catch (error: any) {
      console.error('Error creating fitment:', error);
      setFormError(error.message || 'Failed to create fitment');
    }
  };
  
  // Handle deleting a fitment
  const handleDeleteFitment = async (fitmentId: string) => {
    try {
      const response = await fetch(`/api/vehicle-fitments/${fitmentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete fitment');
      }
      
      // Remove the deleted fitment from the list
      setFitments(fitments.filter(fitment => fitment.id !== fitmentId));
      
      // Show success message
      alert('Tire fitment removed successfully!');
    } catch (error: any) {
      console.error('Error deleting fitment:', error);
      alert(error.message || 'Failed to delete fitment');
    }
  };
  
  // Update URL with filter parameters
  const updateUrlWithFilters = () => {
    let url = '/dashboard/vehicles/fitments?';
    
    if (filters.makeId) url += `makeId=${filters.makeId}&`;
    if (filters.modelId) url += `modelId=${filters.modelId}&`;
    if (filters.trimId) url += `trimId=${filters.trimId}&`;
    if (filters.yearId) url += `yearId=${filters.yearId}&`;
    
    router.push(url.slice(0, -1)); // Remove trailing '&' or '?'
  };
  
  // Get vehicle details string
  const getVehicleDetailsString = () => {
    const make = makes.find(m => m.id === filters.makeId);
    const model = models.find(m => m.id === filters.modelId);
    const trim = trims.find(t => t.id === filters.trimId);
    const year = years.find(y => y.id === filters.yearId);
    
    const parts = [];
    if (make) parts.push(make.name);
    if (model) parts.push(model.name);
    if (trim) parts.push(trim.name);
    if (year) parts.push(year.year.toString());
    
    return parts.join(' ');
  };
  
  // Format tire size
  const formatTireSize = (product: Product) => {
    return `${product.width}/${product.aspectRatio}R${product.rimDiameter}`;
  };
  
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/vehicles" className="flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" />
          <span>Back to Vehicle Management</span>
        </Link>
      </div>
      
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Tire Fitments</h1>
        <p className="text-muted-foreground text-sm">
          Manage which tires fit which vehicles to power the tire finder feature.
        </p>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Vehicles</CardTitle>
          <CardDescription>
            Select a vehicle to manage its tire fitments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="makeId">Make</Label>
              <Select
                value={filters.makeId}
                onValueChange={(value) => setFilters({ ...filters, makeId: value })}
              >
                <SelectTrigger id="makeId">
                  <SelectValue placeholder="Select Make" />
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
            
            <div className="space-y-2">
              <Label htmlFor="modelId">Model</Label>
              <Select
                value={filters.modelId}
                onValueChange={(value) => setFilters({ ...filters, modelId: value })}
                disabled={!filters.makeId || models.length === 0}
              >
                <SelectTrigger id="modelId">
                  <SelectValue placeholder={
                    !filters.makeId 
                      ? "Select Make First" 
                      : models.length === 0 
                        ? "No Models Available" 
                        : "Select Model"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="trimId">Trim</Label>
              <Select
                value={filters.trimId}
                onValueChange={(value) => setFilters({ ...filters, trimId: value })}
                disabled={!filters.modelId || trims.length === 0}
              >
                <SelectTrigger id="trimId">
                  <SelectValue placeholder={
                    !filters.modelId 
                      ? "Select Model First" 
                      : trims.length === 0 
                        ? "No Trims Available" 
                        : "Select Trim"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {trims.map((trim) => (
                    <SelectItem key={trim.id} value={trim.id}>
                      {trim.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="yearId">Year</Label>
              <Select
                value={filters.yearId}
                onValueChange={(value) => setFilters({ ...filters, yearId: value })}
                disabled={!filters.trimId || years.length === 0}
              >
                <SelectTrigger id="yearId">
                  <SelectValue placeholder={
                    !filters.trimId 
                      ? "Select Trim First" 
                      : years.length === 0 
                        ? "No Years Available" 
                        : "Select Year"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={updateUrlWithFilters} 
            className="mt-4"
            disabled={!filters.makeId}
          >
            <Filter className="mr-2 h-4 w-4" />
            Apply Filters
          </Button>
        </CardContent>
      </Card>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {filters.yearId && (
        <Card>
          <CardHeader>
            <CardTitle>Add Tire Fitment</CardTitle>
            <CardDescription>
              Add a tire that fits {getVehicleDetailsString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {formError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="productId">Select Tire</Label>
                <Select
                  value={filters.productId}
                  onValueChange={(value) => setFilters({ ...filters, productId: value })}
                >
                  <SelectTrigger id="productId">
                    <SelectValue placeholder="Select a tire product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.brand.name} {product.model.name} - {formatTireSize(product)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isOEM" 
                    checked={filters.isOEM}
                    onCheckedChange={(checked) => 
                      setFilters({ ...filters, isOEM: checked === true })
                    }
                  />
                  <Label htmlFor="isOEM">OEM Fitment</Label>
                </div>
                
                <Button 
                  onClick={handleCreateFitment}
                  disabled={!filters.productId}
                  className="ml-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Fitment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Tire Fitments</CardTitle>
          <CardDescription>
            {filters.yearId 
              ? `Tire fitments for ${getVehicleDetailsString()}`
              : 'Select a vehicle to see or manage its tire fitments'}
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
          ) : fitments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Car className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No Tire Fitments Found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {filters.yearId 
                  ? `No tires have been associated with ${getVehicleDetailsString()} yet.`
                  : 'Please select a vehicle to view or manage its tire fitments.'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tire</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>OEM</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fitments.map((fitment) => (
                    <TableRow key={fitment.id}>
                      <TableCell>
                        {fitment.product.brand.name} {fitment.product.model.name}
                      </TableCell>
                      <TableCell>
                        {fitment.product.width}/{fitment.product.aspectRatio}R{fitment.product.rimDiameter}
                      </TableCell>
                      <TableCell>
                        {fitment.vehicleYear.trim.model.make.name} {fitment.vehicleYear.trim.model.name} {fitment.vehicleYear.trim.name} {fitment.vehicleYear.year}
                      </TableCell>
                      <TableCell>
                        {fitment.isOEM ? 'Yes' : 'No'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Tire Fitment</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete this tire fitment? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <Button
                                variant="destructive"
                                onClick={() => handleDeleteFitment(fitment.id)}
                              >
                                Delete Fitment
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {totalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          if (page > 1) setPage(page - 1);
                        }}
                        className={page === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(i + 1);
                          }}
                          isActive={page === i + 1}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (page < totalPages) setPage(page + 1);
                        }}
                        className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}