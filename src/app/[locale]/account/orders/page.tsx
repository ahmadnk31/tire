"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { useTranslations } from "next-intl";
import { 
  Card,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Order, OrderStatus, OrderItem } from "@/lib/api/order-api";
import {
  useOrders,
  useCancelOrder,
  useTrackOrder,
  useReorder,
  useEmailInvoice,
  useUpdateOrderNotes,
  useRateOrderItem,
  useOrderHistory
} from "@/hooks/use-order-queries";
import { useUserProfile } from "@/hooks/use-user-queries";
import { StarIcon, ExternalLink } from "lucide-react";

export default function OrdersPage() {
  const router = useRouter();
  const t = useTranslations('Account.orders');
  const tCommon = useTranslations('Account.common');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [trackingDetails, setTrackingDetails] = useState<{ isOpen: boolean; trackingNumber: string | null }>({
    isOpen: false,
    trackingNumber: null,
  });
  
  // State for additional functionality
  const [orderNotes, setOrderNotes] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [ratingItem, setRatingItem] = useState<{ open: boolean; item: OrderItem | null }>({
    open: false, 
    item: null
  });
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string>("");
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  
  
  // Fetch order data
  const { 
    data: orders, 
    isLoading: isLoadingOrders, 
    error: ordersError 
  } = useOrders();
  
  // Track an order
  const { 
    data: trackingData, 
    isLoading: isLoadingTracking 
  } = useTrackOrder(trackingDetails.trackingNumber || "");
  
  // Fetch order history when needed
  const {
    data: orderHistory,
    isLoading: isLoadingHistory,
  } = useOrderHistory(selectedOrder?.id || "");
  
  // Cancel an order
  const { mutate: cancelOrderMutation, isPending: isCancellingOrder } = useCancelOrder();
  
  // Reorder from previous order
  const { mutate: reorderMutation, isPending: isReordering } = useReorder();
  
  // Email invoice
  const { mutate: emailInvoiceMutation, isPending: isEmailingInvoice } = useEmailInvoice();
  
  // Update order notes
  const { mutate: updateNotesMutation, isPending: isUpdatingNotes } = useUpdateOrderNotes();
  
  // Rate order item
  const { mutate: rateItemMutation, isPending: isRatingItem } = useRateOrderItem();
  
  // Filter orders based on status and search query
  const filteredOrders = orders?.filter(order => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesSearch = order.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  }) || [];
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "processing":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{t('status.processing')}</Badge>;
      case "shipped":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">{t('status.shipped')}</Badge>;
      case "delivered":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t('status.delivered')}</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{t('status.cancelled')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    // Get customer notes from metadata
    const customerNotes = order.metadata && typeof order.metadata === 'object' 
      ? (order.metadata as any)?.customerNotes || ""
      : "";
    setOrderNotes(customerNotes);
    setIsModalOpen(true);
  };
  
  const handleCancelOrder = (orderId: string) => {
    cancelOrderMutation(orderId, {
      onSuccess: () => {
        toast.success("Order has been cancelled successfully");
        setIsModalOpen(false);
      },
      onError: (error) => {
        toast.error(`Failed to cancel order: ${error.message}`);
      }
    });
  };
  
  const handleTrackOrder = (trackingNumber: string | null, trackingUrl?: string) => {
    // If there's a tracking URL, open it directly
    if (trackingUrl) {
      window.open(trackingUrl, '_blank');
      return;
    }
    
    // Otherwise show the tracking modal if we have a tracking number
    if (!trackingNumber) {
      toast.error("No tracking information available");
      return;
    }
    
    setTrackingDetails({
      isOpen: true,
      trackingNumber,
    });
  };
  
  const closeTrackingDetails = () => {
    setTrackingDetails({
      isOpen: false,
      trackingNumber: null,
    });
  };
  
  const handleReorder = (orderId: string) => {
    reorderMutation(orderId, {
      onSuccess: (result) => {
        toast.success("Items have been added to your cart");
        if (result.newOrderId) {
          router.push(`/checkout?order=${result.newOrderId}`);
        } else {
          router.push('/cart');
        }
      },
      onError: (error) => {
        toast.error(`Failed to reorder: ${error.message}`);
      }
    });
  };
  
  const handleDownloadInvoice = (orderId: string) => {
    // Create a function to download the invoice
    const downloadInvoice = async () => {
      try {
        // Use the browser's fetch API directly to download the file
        const response = await fetch(`/api/user/orders/${orderId}/invoice`);
        
        if (!response.ok) {
          throw new Error('Failed to download invoice');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `invoice-${orderId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Invoice downloaded successfully");
      } catch (error) {
        toast.error(`Failed to download invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    
    downloadInvoice();
  };
  
  const handleEmailInvoice = (orderId: string, email?: string) => {
    // Check if we have customer email in metadata
    const emailFromMetadata = selectedOrder?.metadata && typeof selectedOrder.metadata === 'object'
      ? (selectedOrder.metadata as any)?.customerEmail || ''
      : '';
    
    const emailToUse = email || emailFromMetadata || selectedOrder?.customerEmail || '';
    
    if (!emailToUse && !customerEmail) {
      setIsInvoiceModalOpen(true);
      return;
    }
    
    emailInvoiceMutation({ 
      orderId, 
      email: email || customerEmail || emailToUse 
    }, {
      onSuccess: () => {
        toast.success("Invoice has been emailed successfully");
        setIsInvoiceModalOpen(false);
        setCustomerEmail("");
      },
      onError: (error) => {
        toast.error(`Failed to email invoice: ${error.message}`);
      }
    });
  };
  
  const handleUpdateNotes = (orderId: string, notes: string) => {
    updateNotesMutation({ orderId, notes }, {
      onSuccess: (updatedOrder) => {
        // Get updated notes from response
        const updatedNotes = updatedOrder.metadata && typeof updatedOrder.metadata === 'object'
          ? (updatedOrder.metadata as any)?.customerNotes || ""
          : updatedOrder.customerNotes || "";
        
        setOrderNotes(updatedNotes);
        toast.success("Order notes updated successfully");
      },
      onError: (error) => {
        toast.error(`Failed to update notes: ${error.message}`);
        // Reset notes to original value
        const originalNotes = selectedOrder?.metadata && typeof selectedOrder.metadata === 'object'
          ? (selectedOrder.metadata as any)?.customerNotes || ""
          : "";
        setOrderNotes(originalNotes);
      }
    });
  };
  
  const openRatingDialog = (item: OrderItem) => {
    setRatingItem({ open: true, item });
    setRating(item.rating || 0);
    setReview("");
  };
  
  const handleRateItem = () => {
    if (!ratingItem.item || !selectedOrder) return;
    
    rateItemMutation({
      orderId: selectedOrder.id,
      itemId: ratingItem.item.id,
      rating,
      review
    }, {
      onSuccess: () => {
        toast.success("Thank you for your rating!");
        setRatingItem({ open: false, item: null });
      },
      onError: (error) => {
        toast.error(`Failed to submit rating: ${error.message}`);
      }
    });
  };
  
  const StarRating = ({ max = 5, value, onChange }: { max: number; value: number; onChange: (value: number) => void }) => {
    return (
      <div className="flex items-center">
        {[...Array(max)].map((_, i) => (
          <StarIcon
            key={i}
            className={`h-5 w-5 cursor-pointer ${
              i < value ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
            }`}
            onClick={() => onChange(i + 1)}
          />
        ))}
      </div>
    );
  };
  // Show loading state
  if (isLoadingOrders) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">{t('title')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Separator />
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-16 w-full mb-2" />
            <Skeleton className="h-16 w-full mb-2" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  // Show error state
  if (ordersError) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">{t('title')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Separator />
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-4">Failed to load orders. Please try again later.</p>
            <Button onClick={() => window.location.reload()}>{tCommon('retry')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>
      <Separator />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="w-full sm:w-auto">
          <Input
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-[250px]"
          />
        </div>
        <div className="w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t('filter.title')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filter.all')}</SelectItem>
              <SelectItem value="processing">{t('filter.processing')}</SelectItem>
              <SelectItem value="shipped">{t('filter.shipped')}</SelectItem>
              <SelectItem value="delivered">{t('filter.delivered')}</SelectItem>
              <SelectItem value="cancelled">{t('filter.cancelled')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>            <TableHeader>
              <TableRow>
                <TableHead>{t('labels.orderNumber')}</TableHead>
                <TableHead>{t('labels.date')}</TableHead>
                <TableHead>{t('labels.status')}</TableHead>
                <TableHead className="text-right">{t('labels.total')}</TableHead>
                <TableHead className="text-right">{t('labels.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.trackingNumber || order.id.substring(0, 8)}</TableCell>
                    <TableCell>{format(parseISO(order.date), "MMM d, yyyy")}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right">                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openOrderDetails(order)}
                      >
                        {t('actions.viewDetails')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    {searchQuery || statusFilter !== "all" 
                      ? t('noResults') 
                      : t('empty.description')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Order Details Modal */}      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {selectedOrder && (
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {t('labels.orderNumber')} #{selectedOrder.trackingNumber || selectedOrder.id.substring(0, 8)}
              </DialogTitle>
              <DialogDescription>
                {t('placedOn')} {format(parseISO(selectedOrder.date), "MMMM d, yyyy")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              {/* Order Actions */}
              <div className="flex flex-wrap gap-2">
                {selectedOrder.status === "processing" && (
                  <Button 
                    variant="destructive"
                    size="sm"
                    disabled={isCancellingOrder}
                    onClick={() => handleCancelOrder(selectedOrder.id)}
                  >
                    {isCancellingOrder ? t('actions.cancelling') : t('actions.cancelOrder')}
                  </Button>
                )}
                
                {/* Invoice & Reorder buttons */}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDownloadInvoice(selectedOrder.id)}
                >
                  {t('actions.downloadInvoice')}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={isEmailingInvoice}
                  onClick={() => handleEmailInvoice(selectedOrder.id)}
                >
                  {isEmailingInvoice ? t('actions.sending') : t('actions.emailInvoice')}
                </Button>
                
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isReordering}
                  onClick={() => handleReorder(selectedOrder.id)}
                >
                  {isReordering ? t('actions.processing') : t('actions.reorderItems')}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsHistoryOpen(true)}
                >
                  {t('actions.viewHistory')}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">{t('labels.shipping')}</h4>
                  <p className="text-sm">{selectedOrder.deliveryAddress}</p>
                  {selectedOrder.trackingNumber && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">{t('labels.tracking')}:</p>
                      <p className="text-sm">{selectedOrder.trackingNumber}</p>
                      {selectedOrder.status === "shipped" && (
                        <div className="mt-1">
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto flex items-center gap-1"
                            onClick={() => handleTrackOrder(
                              selectedOrder.trackingNumber, 
                              selectedOrder.trackingUrl
                            )}
                          >
                            {t('actions.trackShipment')}
                            {selectedOrder.trackingUrl && (
                              <ExternalLink className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {selectedOrder.estimatedDeliveryDate && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">{t('labels.estimatedDelivery')}:</p>
                      <p className="text-sm">{format(parseISO(selectedOrder.estimatedDeliveryDate), "MMMM d, yyyy")}</p>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium mb-2">{t('labels.status')}</h4>
                  <div className="flex items-center">
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">{t('labels.paymentMethod')}</h4>
                    <p className="text-sm">{selectedOrder.paymentMethod}</p>
                    <p className="text-sm">
                      {t('labels.paymentStatus')}: 
                      <span className="ml-1 font-medium">
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Order Notes */}
              <div>
                <h4 className="font-medium mb-2">{t('labels.notes')}</h4>
                <Textarea
                  placeholder={t('notes.placeholder')}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  disabled={isUpdatingNotes || 
                    orderNotes === (
                      (selectedOrder.metadata && typeof selectedOrder.metadata === 'object'
                        ? (selectedOrder.metadata as any)?.customerNotes
                        : "") || ""
                    )
                  }
                  onClick={() => handleUpdateNotes(selectedOrder.id, orderNotes)}
                >
                  {isUpdatingNotes ? t('notes.saving') : t('notes.save')}
                </Button>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-4">{t('labels.items')}</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('labels.items')}</TableHead>
                      <TableHead className="text-right">{t('labels.quantity')}</TableHead>
                      <TableHead className="text-right">{t('labels.price')}</TableHead>
                      <TableHead className="text-right">{t('labels.subtotal')}</TableHead>
                      <TableHead className="text-right">{t('labels.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.imageUrl && (
                              <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div>
                              <p>{item.name}</p>
                              {item.rating && (
                                <div className="flex items-center text-xs text-yellow-500 mt-1">
                                  {[...Array(5)].map((_, i) => (
                                    <StarIcon 
                                      key={i} 
                                      className={`h-3 w-3 ${i < item.rating! ? "fill-current" : "text-gray-300"}`} 
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          {selectedOrder.status === "delivered" && !item.rating && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => openRatingDialog(item)}
                            >
                              {t('actions.rate')}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-medium">
                        {t('labels.subtotal')}
                      </TableCell>
                      <TableCell className="text-right">
                        ${selectedOrder?.subtotal?.toFixed(2)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-medium">
                        {t('labels.orderTotal')}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ${selectedOrder.total.toFixed(2)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={() => setIsModalOpen(false)}>
                {tCommon('close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
      
      {/* Order History Modal */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('history.title')}</DialogTitle>
            <DialogDescription>
              {t('labels.orderNumber')} #{selectedOrder?.trackingNumber || selectedOrder?.id.substring(0, 8)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {isLoadingHistory ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : orderHistory ? (
              <div className="space-y-4">
                {orderHistory.map((event, index) => (
                  <div 
                    key={index} 
                    className={`p-3 border rounded-md ${index === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}
                  >
                    <p className="font-medium">{event.status}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(event.date), "MMM d, yyyy h:mm a")}
                    </p>
                    {event.note && (
                      <p className="text-sm mt-1">{event.note}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                {t('history.noHistory')}
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsHistoryOpen(false)}>{tCommon('cancel')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Rating Dialog */}
      <Dialog open={ratingItem.open} onOpenChange={(open) => setRatingItem({ ...ratingItem, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('rating.title')}</DialogTitle>
            <DialogDescription>
              {ratingItem.item?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('rating.yourRating')}</label>
              <StarRating max={5} value={rating} onChange={setRating} />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">{t('rating.yourReview')}</label>
              <Textarea
                placeholder={t('rating.placeholder')}
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRatingItem({ open: false, item: null })}>
              {tCommon('cancel')}
            </Button>
            <Button 
              disabled={isRatingItem || rating === 0} 
              onClick={handleRateItem}
            >
              {isRatingItem ? t('rating.submitting') : t('rating.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Email Invoice Dialog */}
      <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('invoice.title')}</DialogTitle>
            <DialogDescription>
              {t('invoice.description')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              type="email"
              placeholder={t('invoice.placeholder')}
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInvoiceModalOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button 
              disabled={isEmailingInvoice || !customerEmail} 
              onClick={() => selectedOrder && handleEmailInvoice(selectedOrder.id, customerEmail)}
            >
              {isEmailingInvoice ? t('actions.sending') : t('invoice.send')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Tracking Information Modal */}
      <Dialog open={trackingDetails.isOpen} onOpenChange={closeTrackingDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('tracking.title')}
            </DialogTitle>
            <DialogDescription>
              {t('tracking.number')}: {trackingDetails.trackingNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {isLoadingTracking ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : trackingData ? (
              <div className="space-y-4">
                <p className="text-sm font-medium">{t('tracking.currentStatus')}:
                  <span className="ml-2 font-normal">{trackingData.status}</span>
                </p>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">{t('tracking.updates')}</h4>
                  <div className="space-y-3">
                    {trackingData.updates.map((update, index) => (
                      <div 
                        key={index} 
                        className={`p-3 rounded-lg border ${index === 0 ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
                      >
                        <p className="text-sm font-medium">{update.status}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(update.date), "MMM d, yyyy h:mm a")} - {update.location}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {trackingData?.trackingUrl && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(trackingData.trackingUrl, '_blank')}
                    >
                      {t('tracking.viewOnCarrier')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                {t('tracking.noTracking')}
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={closeTrackingDetails}>
              {tCommon('close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}