"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";

// UI Components
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Check,
  CircleX,
  Edit,
  Eye,
  Loader2,
  PlusCircle,
  RefreshCw,
  Search,
  Star,
  StarOff,
  TrashIcon,
  X
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { AddTestimonialForm } from "./components/add-testimonial-form";
import { EditTestimonialForm } from "./components/edit-testimonial-form";

// Define types
interface Testimonial {
  id: string;
  customerName: string;
  customerTitle?: string;
  customerImage?: string;
  content: string;
  rating: number;
  isVisible: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FEATURED';
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const fetchTestimonials = async () => {
  const response = await axios.get('/api/testimonials');
  return response.data.testimonials;
};

const TestimonialStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'PENDING':
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending Review</Badge>;
    case 'APPROVED':
      return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
    case 'FEATURED':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center">
        <Star className="h-3 w-3 mr-1 fill-blue-800" /> Featured
      </Badge>;
    case 'REJECTED':
      return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Unknown</Badge>;
  }
};

export default function TestimonialsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewTestimonialId, setViewTestimonialId] = useState<string | null>(null);
  const [editTestimonialId, setEditTestimonialId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  // Fetch testimonials
  const { 
    data: testimonials = [], 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['testimonials'],
    queryFn: fetchTestimonials
  });

  // Update testimonial status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string, status: string, adminNotes?: string }) => {
      return axios.patch(`/api/testimonials/${id}/status`, { status, adminNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      toast.success('Testimonial status updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update testimonial status:', error);
      toast.error('Failed to update testimonial status');
    }
  });

  // Delete testimonial mutation
  const deleteTestimonialMutation = useMutation({
    mutationFn: async (id: string) => {
      return axios.delete(`/api/testimonials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      toast.success('Testimonial deleted successfully');
      setIsDeleteDialogOpen(false);
      setTestimonialToDelete(null);
    },
    onError: (error) => {
      console.error('Failed to delete testimonial:', error);
      toast.error('Failed to delete testimonial');
    }
  });

  const handleUpdateStatus = (id: string, status: string, adminNotes?: string) => {
    updateStatusMutation.mutate({ id, status, adminNotes });
  };

  const handleDeleteConfirm = () => {
    if (testimonialToDelete) {
      deleteTestimonialMutation.mutate(testimonialToDelete);
    }
  };

  // Filter testimonials based on search term and status filter
  const filteredTestimonials = testimonials.filter((testimonial: Testimonial) => {
    const matchesSearch = searchTerm === '' || 
      testimonial.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.content.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'ALL' || testimonial.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Find the testimonial being viewed or edited
  const viewedTestimonial = viewTestimonialId 
    ? testimonials.find((t: Testimonial) => t.id === viewTestimonialId) 
    : null;
    
  const editedTestimonial = editTestimonialId 
    ? testimonials.find((t: Testimonial) => t.id === editTestimonialId) 
    : null;

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Testimonials</h1>
          <p className="text-muted-foreground">
            Manage customer testimonials and reviews
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => refetch()} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Testimonial
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search testimonials..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending Review</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="FEATURED">Featured</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testimonials.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testimonials.filter((t: Testimonial) => t.status === 'PENDING').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testimonials.filter((t: Testimonial) => t.status === 'APPROVED' || t.status === 'FEATURED').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testimonials.filter((t: Testimonial) => t.status === 'FEATURED').length}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Testimonials Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-red-500">Error loading testimonials</div>
            </div>
          ) : filteredTestimonials.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-muted-foreground">No testimonials found</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submission Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTestimonials.map((testimonial: Testimonial) => (
                  <TableRow key={testimonial.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{testimonial.customerName}</div>
                        {testimonial.customerTitle && (
                          <div className="text-xs text-muted-foreground">{testimonial.customerTitle}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {renderStars(testimonial.rating)}
                    </TableCell>
                    <TableCell>
                      <TestimonialStatusBadge status={testimonial.status} />
                    </TableCell>
                    <TableCell>
                      {format(new Date(testimonial.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setViewTestimonialId(testimonial.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setEditTestimonialId(testimonial.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        {testimonial.status === 'PENDING' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleUpdateStatus(testimonial.id, 'APPROVED')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleUpdateStatus(testimonial.id, 'REJECTED')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        {testimonial.status === 'APPROVED' && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleUpdateStatus(testimonial.id, 'FEATURED')}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {testimonial.status === 'FEATURED' && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleUpdateStatus(testimonial.id, 'APPROVED')}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <StarOff className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setTestimonialToDelete(testimonial.id);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* View Testimonial Dialog */}
      <Dialog open={!!viewTestimonialId} onOpenChange={(open) => !open && setViewTestimonialId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>View Testimonial</DialogTitle>
          </DialogHeader>
          
          {viewedTestimonial && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <div className="font-medium mb-1">Customer</div>
                  <div>{viewedTestimonial.customerName}</div>
                </div>
                
                {viewedTestimonial.customerTitle && (
                  <div>
                    <div className="font-medium mb-1">Title/Company</div>
                    <div>{viewedTestimonial.customerTitle}</div>
                  </div>
                )}
                
                <div>
                  <div className="font-medium mb-1">Rating</div>
                  <div>{renderStars(viewedTestimonial.rating)}</div>
                </div>
                
                <div>
                  <div className="font-medium mb-1">Status</div>
                  <div><TestimonialStatusBadge status={viewedTestimonial.status} /></div>
                </div>
                
                <div>
                  <div className="font-medium mb-1">Submission Date</div>
                  <div>{format(new Date(viewedTestimonial.createdAt), 'MMMM d, yyyy')}</div>
                </div>
                
                <div>
                  <div className="font-medium mb-1">Testimonial</div>
                  <div className="bg-gray-100 p-4 rounded-md">{viewedTestimonial.content}</div>
                </div>
                
                {viewedTestimonial.adminNotes && (
                  <div>
                    <div className="font-medium mb-1">Admin Notes</div>
                    <div className="bg-yellow-50 p-4 rounded-md text-sm">{viewedTestimonial.adminNotes}</div>
                  </div>
                )}
              </div>
              
              {/* Status Update Section */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Update Status</h3>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={viewedTestimonial.status === 'APPROVED' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      handleUpdateStatus(viewedTestimonial.id, 'APPROVED');
                      setViewTestimonialId(null);
                    }}
                  >
                    <Check className="mr-2 h-4 w-4" /> Approve
                  </Button>
                  <Button 
                    variant={viewedTestimonial.status === 'FEATURED' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      handleUpdateStatus(viewedTestimonial.id, 'FEATURED');
                      setViewTestimonialId(null);
                    }}
                  >
                    <Star className="mr-2 h-4 w-4" /> Feature
                  </Button>
                  <Button 
                    variant={viewedTestimonial.status === 'REJECTED' ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => {
                      handleUpdateStatus(viewedTestimonial.id, 'REJECTED');
                      setViewTestimonialId(null);
                    }}
                  >
                    <X className="mr-2 h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewTestimonialId(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Testimonial Dialog */}
      <Dialog open={!!editTestimonialId} onOpenChange={(open) => !open && setEditTestimonialId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Testimonial</DialogTitle>
          </DialogHeader>
          
          {editedTestimonial && (
            <EditTestimonialForm 
              testimonial={editedTestimonial} 
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['testimonials'] });
                setEditTestimonialId(null);
              }}
              onCancel={() => setEditTestimonialId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Add Testimonial Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Testimonial</DialogTitle>
            <DialogDescription>
              Create a new testimonial to showcase on your website.
            </DialogDescription>
          </DialogHeader>
          
          <AddTestimonialForm 
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['testimonials'] });
              setIsAddDialogOpen(false);
            }}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Testimonial</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this testimonial? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={deleteTestimonialMutation.isPending}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={deleteTestimonialMutation.isPending}
            >
              {deleteTestimonialMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <TrashIcon className="mr-2 h-4 w-4" /> Delete
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
