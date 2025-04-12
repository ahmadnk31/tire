"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {  useRef } from "react";
import axios from "axios";
import { format } from "date-fns";
import { ArrowLeft, Truck, Package, Check, X, RefreshCw, Edit, Download, Printer, ExternalLink, Mail, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { ManualShippingDialog } from "../components/manual-shipping-dialog";
import { ParamValue } from "next/dist/server/request/params";

// We'll import pdf-lib directly in the functions that need it
// This ensures it only gets imported client-side

// Fetch a single order by ID
const fetchOrder = async (orderId: ParamValue) => {
  try {
    console.log(`Fetching order details for ID: ${orderId}`);
    const response = await axios.get(`/api/orders/${orderId}`);
    console.log("Order details response:", response.data);
    return response.data.order;
  } catch (error) {
    console.error(`Error fetching order ${orderId}:`, error);
    throw error;
  }
};

// Fetch order history by order ID
const fetchOrderHistory = async (orderId: ParamValue) => {
  try {
    console.log(`Fetching order history for ID: ${orderId}`);
    const response = await axios.get(`/api/orders/${orderId}/history`);
    console.log("Order history response:", response.data);
    return response.data.history;
  } catch (error) {
    console.error(`Error fetching order history ${orderId}:`, error);
    throw error;
  }
};

// Order status badge component
function OrderStatusBadge({ status }) {
  let badgeStyles = "";
  let icon = null;
  
  switch(status) {
    case "PENDING":
      badgeStyles = "bg-yellow-100 text-yellow-800 border-yellow-200";
      icon = <Package className="h-3.5 w-3.5 mr-1" />;
      break;
    case "PROCESSING":
      badgeStyles = "bg-blue-100 text-blue-800 border-blue-200";
      icon = <Package className="h-3.5 w-3.5 mr-1" />;
      break;
    case "SHIPPED":
      badgeStyles = "bg-purple-100 text-purple-800 border-purple-200";
      icon = <Truck className="h-3.5 w-3.5 mr-1" />;
      break;
    case "DELIVERED":
      badgeStyles = "bg-green-100 text-green-800 border-green-200";
      icon = <Check className="h-3.5 w-3.5 mr-1" />;
      break;
    case "CANCELLED":
      badgeStyles = "bg-red-100 text-red-800 border-red-200";
      icon = <X className="h-3.5 w-3.5 mr-1" />;
      break;
    case "CREATED":
      badgeStyles = "bg-blue-100 text-blue-800 border-blue-200";
      icon = <Package className="h-3.5 w-3.5 mr-1" />;
      break;
    case "PAYMENT_CONFIRMED":
      badgeStyles = "bg-green-100 text-green-800 border-green-200";
      icon = <Check className="h-3.5 w-3.5 mr-1" />;
      break;
    case "TRACKING_ADDED":
      badgeStyles = "bg-purple-100 text-purple-800 border-purple-200";
      icon = <Truck className="h-3.5 w-3.5 mr-1" />;
      break;
    default:
      badgeStyles = "bg-gray-100 text-gray-800 border-gray-200";
  }
  
  return (
    <Badge variant="outline" className={`flex items-center ${badgeStyles}`}>
      {icon}
      {status === "PAYMENT_CONFIRMED" ? "Payment Confirmed" : 
       status === "TRACKING_ADDED" ? "Tracking Added" :
       status === "CREATED" ? "Created" :
       status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}

// Payment status badge component
function PaymentStatusBadge({ status }) {
  let badgeStyles = "";
  
  switch(status) {
    case "PENDING":
      badgeStyles = "bg-yellow-100 text-yellow-800 border-yellow-200";
      break;
    case "PAID":
      badgeStyles = "bg-green-100 text-green-800 border-green-200";
      break;
    case "FAILED":
      badgeStyles = "bg-red-100 text-red-800 border-red-200";
      break;
    case "REFUNDED":
      badgeStyles = "bg-purple-100 text-purple-800 border-purple-200";
      break;
    default:
      badgeStyles = "bg-gray-100 text-gray-800 border-gray-200";
  }
  
  return (
    <Badge variant="outline" className={badgeStyles}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}

export default function SingleOrderPage() {
  const params = useParams();
  const router = useRouter();
  const [trackingInfo, setTrackingInfo] = useState({
    carrier: "",
    trackingNumber: "",
    trackingUrl: ""
  });
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  
  // Ref for the invoice element we want to convert to PDF
  const invoiceRef = useRef(null);
  
  const orderId = params.id;
  
  // React Query hook for fetching the order details
  const { 
    data: order, 
    isLoading: isOrderLoading, 
    isError: isOrderError, 
    error: orderError, 
    refetch: refetchOrder 
  } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fetchOrder(orderId),
    refetchOnWindowFocus: false,
    enabled: !!orderId, // Only run query if orderId exists
  });
  
  // React Query hook for fetching order history
  const {
    data: orderHistory,
    isLoading: isHistoryLoading,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ["orderHistory", orderId],
    queryFn: () => fetchOrderHistory(orderId),
    refetchOnWindowFocus: false,
    enabled: !!orderId, // Only run query if orderId exists
  });
  
  // Update tracking info when order data is loaded
  useEffect(() => {
    if (order) {
      setTrackingInfo({
        carrier: order.carrier || "",
        trackingNumber: order.trackingNumber || "",
        trackingUrl: order.trackingUrl || ""
      });
    }
  }, [order]);
  
  // Handle status update
  const handleStatusUpdate = async (newStatus) => {
    try {
      await axios.patch(`/api/orders/${orderId}`, { status: newStatus });
      toast.success("Order status updated successfully!");
      refetchOrder(); // Refetch order details
      refetchHistory(); // Refetch order history
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast.error("Failed to update order status. Please try again.");
    }
  };
  
  // Handle adding tracking information
  const handleAddTracking = async () => {
    try {
      await axios.patch(`/api/orders/${orderId}`, {
        trackingNumber: trackingInfo.trackingNumber,
        trackingUrl: trackingInfo.trackingUrl,
      });
      toast.success("Tracking information added successfully!");
      setIsTrackingDialogOpen(false);
      refetchOrder(); // Refetch order details
      refetchHistory(); // Refetch order history
    } catch (error) {
      console.error("Failed to update tracking info:", error);
      toast.error("Failed to update tracking information. Please try again.");
    }
  };
  
  // Handle invoice download
  const handleDownloadInvoice = async () => {
    try {
      setIsPdfGenerating(true);
      
      // Get order data
      if (!order) {
        throw new Error("Order data not available");
      }
      
      // Import pdf-lib directly when needed
      const { PDFDocument, rgb, StandardFonts, degrees } = await import('pdf-lib');
      
      // Create a new PDFDocument
      const pdfDoc = await PDFDocument.create();
      
      // Embed the standard fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Add a page to the document
      const page = pdfDoc.addPage([595, 842]); // A4 size in points
      const { width, height } = page.getSize();
      
      // Set some constants for layout
      const margin = 50;
      const textSize = 12;
      const headerSize = 16;
      const titleSize = 24;
      const lineHeight = textSize * 1.5;
      
      // Helper function for drawing text
      const drawText = (text, x, y, { font = helveticaFont, size = textSize, color = rgb(0, 0, 0) } = {}) => {
        page.drawText(text, {
          x,
          y: height - y, // PDF coordinates start from bottom
          font,
          size,
          color
        });
      };
      
      // Draw header
      drawText("INVOICE", margin, 80, { font: helveticaBold, size: titleSize });
      
      drawText(`Invoice #: ${order.orderNumber}`, margin, 120, { font: helveticaBold, size: headerSize });
      drawText(`Date: ${format(new Date(order.createdAt), "MMM d, yyyy")}`, margin, 140);
      
      // Company info
      drawText("FROM:", margin, 180, { font: helveticaBold });
      drawText("Tire Shop", margin, 200);
      drawText("123 Tire Street", margin, 220);
      drawText("Tireland, CA 90210", margin, 240);
      drawText("Phone: (555) 123-4567", margin, 260);
      
      // Customer info
      drawText("BILL TO:", width / 2, 180, { font: helveticaBold });
      drawText(order.user.name || "Customer", width / 2, 200);
      drawText(order.billingAddressLine1 || "", width / 2, 220);
      if (order.billingAddressLine2) {
        drawText(order.billingAddressLine2, width / 2, 240);
      }
      drawText(`${order.billingCity || ""}, ${order.billingState || ""} ${order.billingPostalCode || ""}`, width / 2, 260);
      drawText(order.billingCountry || "", width / 2, 280);
      
      // Draw horizontal line
      page.drawLine({
        start: { x: margin, y: height - 310 },
        end: { x: width - margin, y: height - 310 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8)
      });
      
      // Table header
      drawText("Item", margin, 330, { font: helveticaBold });
      drawText("Description", margin + 50, 330, { font: helveticaBold });
      drawText("Qty", width - 200, 330, { font: helveticaBold });
      drawText("Price", width - 150, 330, { font: helveticaBold });
      drawText("Total", width - 80, 330, { font: helveticaBold });
      
      // Draw horizontal line
      page.drawLine({
        start: { x: margin, y: height - 340 },
        end: { x: width - margin, y: height - 340 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8)
      });
      
      // Table body
      let yPos = 360;
      order.orderItems?.forEach((item, index) => {
        drawText(`${index + 1}`, margin, yPos);
        drawText(item.product?.name || "Product", margin + 50, yPos);
        drawText(item.quantity.toString(), width - 200, yPos);
        drawText(`$${item.price.toFixed(2)}`, width - 150, yPos);
        drawText(`$${(item.price * item.quantity).toFixed(2)}`, width - 80, yPos);
        yPos += lineHeight;
      });
      
      // Draw horizontal line
      page.drawLine({
        start: { x: margin, y: height - yPos - 10 },
        end: { x: width - margin, y: height - yPos - 10 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8)
      });
      
      // Table footer - totals
      yPos += 20;
      drawText("Subtotal:", width - 150, yPos, { font: helveticaBold });
      drawText(`$${order.subtotal.toFixed(2)}`, width - 80, yPos);
      
      yPos += lineHeight;
      drawText("Tax:", width - 150, yPos, { font: helveticaBold });
      drawText(`$${(order.taxAmount || 0).toFixed(2)}`, width - 80, yPos);
      
      yPos += lineHeight;
      if (order.shippingAmount) {
        drawText("Shipping:", width - 150, yPos, { font: helveticaBold });
        drawText(`$${order.shippingAmount.toFixed(2)}`, width - 80, yPos);
        yPos += lineHeight;
      }
      
      yPos += 10;
      // Draw horizontal line
      page.drawLine({
        start: { x: width - 200, y: height - yPos },
        end: { x: width - margin, y: height - yPos },
        thickness: 1,
        color: rgb(0, 0, 0)
      });
      
      yPos += 20;
      drawText("Total:", width - 150, yPos, { font: helveticaBold, size: headerSize });
      drawText(`$${order.total.toFixed(2)}`, width - 80, yPos, { font: helveticaBold, size: headerSize });
      
      // Notes
      yPos += lineHeight * 2;
      drawText("Notes:", margin, yPos, { font: helveticaBold });
      yPos += lineHeight;
      drawText("Thank you for your business!", margin, yPos);
      
      // Serialize the PDFDocument to bytes
      const pdfBytes = await pdfDoc.save();
      
      // Create a blob from the bytes
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a link element to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${order.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading invoice as PDF:', error);
      toast.error('Failed to generate PDF invoice');
    } finally {
      setIsPdfGenerating(false);
    }
  };
  
  // Generate PDF using only pdf-lib
  const generatePDF = async () => {
    try {
      setIsPdfGenerating(true);
      
      // Get order data
      if (!order) {
        throw new Error("Order data not available");
      }
      
      // Import pdf-lib
      const { PDFDocument, rgb, StandardFonts, degrees } = await import('pdf-lib');
      
      // Create a new PDFDocument
      const pdfDoc = await PDFDocument.create();
      
      // Embed the standard fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Add a page to the document
      const page = pdfDoc.addPage([595, 842]); // A4 size in points
      const { width, height } = page.getSize();
      
      // Set some constants for layout
      const margin = 50;
      const textSize = 10;
      const headerSize = 14;
      const titleSize = 22;
      const lineHeight = textSize * 1.5;
      const col1 = margin;
      const col2 = margin + 150;
      const col3 = width - 200;
      const col4 = width - 150;
      const col5 = width - 80;
      
      // Helper function for drawing text
      const drawText = (text, x, y, { font = helveticaFont, size = textSize, color = rgb(0, 0, 0) } = {}) => {
        if (!text) return; // Don't draw empty text
        page.drawText(String(text), {
          x,
          y: height - y, // PDF coordinates start from bottom
          font,
          size,
          color
        });
      };
      
      // Helper function for drawing a line
      const drawLine = (startX, startY, endX, endY, { thickness = 1, color = rgb(0.8, 0.8, 0.8) } = {}) => {
        page.drawLine({
          start: { x: startX, y: height - startY },
          end: { x: endX, y: height - startY },
          thickness,
          color
        });
      };
      
      // Draw logo placeholder (optional)
      // You can replace this with your actual logo
      page.drawRectangle({
        x: margin,
        y: height - 80,
        width: 100,
        height: 40,
        color: rgb(0.9, 0.9, 0.9),
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1,
      });
      drawText("TIRE SHOP", margin + 10, 70, { font: helveticaBold, size: 16 });
      
      // Draw header
      drawText("INVOICE", width - margin - 100, 70, { font: helveticaBold, size: titleSize });
      
      // Draw invoice details
      drawText(`Invoice #: ${order.orderNumber}`, width - margin - 100, 100, { font: helveticaBold });
      drawText(`Date: ${format(new Date(order.createdAt), "MMM d, yyyy")}`, width - margin - 100, 120);
      
      // Company info
      drawText("FROM:", margin, 150, { font: helveticaBold });
      drawText("Tire Shop Inc.", margin, 170);
      drawText("123 Tire Street", margin, 185);
      drawText("Tireland, CA 90210", margin, 200);
      drawText("Phone: (555) 123-4567", margin, 215);
      drawText("Email: sales@tireshop.com", margin, 230);
      
      // Customer info
      drawText("BILL TO:", width / 2, 150, { font: helveticaBold });
      drawText(order.user?.name || "Customer", width / 2, 170);
      drawText(order.billingAddressLine1 || "", width / 2, 185);
      if (order.billingAddressLine2) {
        drawText(order.billingAddressLine2, width / 2, 200);
      }
      
      const cityStateZip = [
        order.billingCity, 
        order.billingState, 
        order.billingPostalCode
      ].filter(Boolean).join(", ");
      
      drawText(cityStateZip, width / 2, order.billingAddressLine2 ? 215 : 200);
      drawText(order.billingCountry || "", width / 2, order.billingAddressLine2 ? 230 : 215);
      
      // Draw horizontal line
      drawLine(margin, 260, width - margin, 260, { thickness: 1 });
      
      // Table header
      const tableTop = 280;
      drawText("ITEM", col1, tableTop, { font: helveticaBold });
      drawText("DESCRIPTION", col2, tableTop, { font: helveticaBold });
      drawText("QTY", col3, tableTop, { font: helveticaBold });
      drawText("PRICE", col4, tableTop, { font: helveticaBold });
      drawText("TOTAL", col5, tableTop, { font: helveticaBold });
      
      // Draw horizontal line below header
      drawLine(margin, tableTop + 20, width - margin, tableTop + 20);
      
      // Table body
      let yPos = tableTop + 40;
      const items = order.orderItems || [];
      items.forEach((item, index) => {
        const productName = item.product?.name || "Product";
        drawText(`${index + 1}`, col1, yPos);
        
        // Handle long product names (wrap if needed)
        if (productName.length > 30) {
          const firstLine = productName.substring(0, 30);
          const secondLine = productName.substring(30);
          drawText(firstLine, col2, yPos);
          drawText(secondLine, col2, yPos + lineHeight);
          yPos += lineHeight; // Add extra line height for wrapped text
        } else {
          drawText(productName, col2, yPos);
        }
        
        drawText(item.quantity.toString(), col3, yPos);
        drawText(`$${(item.price || 0).toFixed(2)}`, col4, yPos);
        drawText(`$${((item.price || 0) * item.quantity).toFixed(2)}`, col5, yPos);
        yPos += lineHeight + 5; // Add some space between items
      });
      
      // Draw horizontal line
      drawLine(margin, yPos + 10, width - margin, yPos + 10);
      
      // Calculate totals
      const subtotal = order.subtotal || 0;
      const taxAmount = order.taxAmount || 0;
      const shippingAmount = order.shippingAmount || 0;
      const total = order.total || subtotal + taxAmount + shippingAmount;
      
      // Table footer - totals
      yPos += 30;
      drawText("Subtotal:", col4, yPos, { font: helveticaBold });
      drawText(`$${subtotal.toFixed(2)}`, col5, yPos);
      
      yPos += lineHeight;
      drawText("Tax:", col4, yPos, { font: helveticaBold });
      drawText(`$${taxAmount.toFixed(2)}`, col5, yPos);
      
      yPos += lineHeight;
      drawText("Shipping:", col4, yPos, { font: helveticaBold });
      drawText(`$${shippingAmount.toFixed(2)}`, col5, yPos);
      
      yPos += 10;
      // Draw horizontal line for total
      drawLine(col3, yPos + 10, width - margin, yPos + 10, { 
        thickness: 1.5,
        color: rgb(0, 0, 0)
      });
      
      yPos += 25;
      drawText("Total:", col4, yPos, { font: helveticaBold, size: headerSize });
      drawText(`$${total.toFixed(2)}`, col5, yPos, { font: helveticaBold });
      
      // Add payment information
      yPos += lineHeight * 2;
      drawText("PAYMENT INFORMATION", margin, yPos, { font: helveticaBold });
      yPos += lineHeight;
      drawText(`Payment Status: ${order.paymentStatus || "Unknown"}`, margin, yPos);
      yPos += lineHeight;
      drawText(`Payment Method: ${order.paymentMethod || "Credit Card"}`, margin, yPos);
      
      // Add notes
      yPos += lineHeight * 2;
      drawText("NOTES", margin, yPos, { font: helveticaBold });
      yPos += lineHeight;
      drawText("Thank you for your business!", margin, yPos);
      
      // Add footer
      const footerY = height - 50;
      drawLine(margin, footerY - 20, width - margin, footerY - 20, { 
        color: rgb(0.7, 0.7, 0.7),
        thickness: 0.5 
      });
      drawText("This is a computer-generated invoice and does not require a signature.", 
               margin, footerY - 10, { size: 8, color: rgb(0.5, 0.5, 0.5) });
      
      // Serialize the PDFDocument to a Uint8Array
      const pdfBytes = await pdfDoc.save();
      
      // Convert to Base64 string
      const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
      
      return pdfBase64;
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF invoice');
      throw error;
    } finally {
      setIsPdfGenerating(false);
    }
  };
  
  // Handle email invoice with PDF
  const handleEmailInvoice = async () => {
    try {
      setIsEmailSending(true);
      
      // Generate PDF base64 data
      const pdfBase64 = await generatePDF();
      
      // Send email with PDF attachment
      const response = await axios.post(`/api/orders/${orderId}/email-invoice`, {
        email: customEmail || undefined,
        pdfBase64: pdfBase64
      });
      
      if (response.data.success) {
        toast.success("Invoice sent successfully!");
        setIsEmailDialogOpen(false);
        setCustomEmail("");
      } else {
        throw new Error(response.data.error || "Failed to send invoice");
      }
    } catch (error) {
      console.error("Failed to email invoice:", error);
      toast.error(`Failed to send invoice: ${error.message || "Unknown error"}`);
    } finally {
      setIsEmailSending(false);
    }
  };
  
  // Handle order print (real print functionality)
  const handlePrintOrder = () => {
    window.print();
  };
  
  // Go back to orders list
  const goBack = () => {
    router.push("/dashboard/orders");
  };
  
  // Refetch all data
  const refreshAll = () => {
    refetchOrder();
    refetchHistory();
  };
  
  // Show loading state
  if (isOrderLoading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" onClick={goBack} className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Loading Order...</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (isOrderError) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" onClick={goBack} className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Error</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-red-500">
              <p>Failed to load order details: {orderError?.message || "Unknown error"}</p>
              <Button onClick={refetchOrder} className="mt-4">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If we have order data, render the order details
  return (
    <div className="container mx-auto py-10 space-y-6">
      {/* Header with back button and actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" onClick={goBack} className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Order #{order?.orderNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              Placed on {order?.createdAt ? format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a") : 'Unknown date'}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handlePrintOrder}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownloadInvoice}>
            <Download className="mr-2 h-4 w-4" />
            Invoice
          </Button>
          
          <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Email PDF Invoice
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Email PDF Invoice</DialogTitle>
                <DialogDescription>
                  Send the invoice as PDF for this order via email.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    placeholder={order?.customer?.email || "customer@example.com"}
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Leave blank to send to customer's email: {order?.customer?.email}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)} disabled={isEmailSending || isPdfGenerating}>
                  Cancel
                </Button>
                <Button onClick={() => handleEmailInvoice()} disabled={isEmailSending || isPdfGenerating}>
                  {isEmailSending || isPdfGenerating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      {isPdfGenerating ? "Generating PDF..." : "Sending..."}
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Send PDF Invoice
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button onClick={refreshAll}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Order status and actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <OrderStatusBadge status={order?.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Payment:</span>
                <PaymentStatusBadge status={order?.paymentStatus} />
              </div>
              <Separator />
              <div className="flex flex-col space-y-2">
                <span className="text-sm font-medium">Update Status:</span>
                <Select 
                  defaultValue={order?.status}
                  onValueChange={(value) => handleStatusUpdate(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="SHIPPED">Shipped</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Customer Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div>
                <p className="text-sm font-medium">{order?.customer?.name}</p>
                <p className="text-sm text-muted-foreground">{order?.customer?.email}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium">Shipping Address</p>
                <p className="text-sm text-muted-foreground">{order?.shippingAddressLine1}</p>
                {order?.shippingAddressLine2 && (
                  <p className="text-sm text-muted-foreground">{order?.shippingAddressLine2}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {order?.shippingCity}, {order?.shippingState} {order?.shippingPostalCode}
                </p>
                <p className="text-sm text-muted-foreground">{order?.shippingCountry}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium">Billing Address</p>
                <p className="text-sm text-muted-foreground">{order?.billingAddress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Shipping Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Shipping</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div>
                <p className="text-sm font-medium">Method</p>
                <p className="text-sm text-muted-foreground">
                  {order?.shippingMethod || "Standard Shipping"}
                </p>
              </div>
              <Separator />
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Tracking Number</p>
                  <Dialog open={isTrackingDialogOpen} onOpenChange={setIsTrackingDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Tracking Information</DialogTitle>
                        <DialogDescription>
                          Enter the tracking details for this order.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="carrier">Carrier</Label>
                          <Input
                            id="carrier"
                            value={trackingInfo.carrier}
                            onChange={(e) => setTrackingInfo({...trackingInfo, carrier: e.target.value})}
                            placeholder="FedEx, UPS, etc."
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="trackingNumber">Tracking Number</Label>
                          <Input
                            id="trackingNumber"
                            value={trackingInfo.trackingNumber}
                            onChange={(e) => setTrackingInfo({...trackingInfo, trackingNumber: e.target.value})}
                            placeholder="Enter tracking number"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="trackingUrl">Tracking URL</Label>
                          <Input
                            id="trackingUrl"
                            value={trackingInfo.trackingUrl}
                            onChange={(e) => setTrackingInfo({...trackingInfo, trackingUrl: e.target.value})}
                            placeholder="https://example.com/track"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTrackingDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddTracking}>Save</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                {order?.trackingNumber ? (
                  <div className="text-sm">
                    <p className="text-sm text-muted-foreground">
                      {order.trackingNumber}
                    </p>
                    {order.trackingUrl && (
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:underline mt-1"
                      >
                        Track Package
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not available</p>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium">Expected Delivery</p>
                <p className="text-sm text-muted-foreground">
                  {order?.status === "SHIPPED" ? 
                    format(new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), "MMMM d, yyyy") : 
                    "To be determined"}
                </p>
              </div>
              
              {/* Manual shipping creation */}
              {order?.status !== "SHIPPED" && order?.status !== "DELIVERED" && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Manual Shipping</p>
                    <ManualShippingDialog 
                      order={order}
                      onSuccess={(shipmentResponse) => {
                        // Update the tracking information
                        setTrackingInfo({
                          carrier: "DHL",
                          trackingNumber: shipmentResponse.trackingNumber,
                          trackingUrl: shipmentResponse.labelUrl || ""
                        });
                        // Refresh order data
                        refreshAll();
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Create shipping manually when automatic shipping fails
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
          <CardDescription>
            Items purchased in this order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order?.orderItems?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.product?.images?.[0] ? (
                      <div className="h-12 w-12 rounded overflow-hidden">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded bg-secondary flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.product?.brand?.name} {item.product?.name}
                  </TableCell>
                  <TableCell className="text-right">${item.price?.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}></TableCell>
                <TableCell className="text-right">Subtotal</TableCell>
                <TableCell className="text-right">${order?.subtotal?.toFixed(2) || "0.00"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3}></TableCell>
                <TableCell className="text-right">Tax & Shipping</TableCell>
                <TableCell className="text-right">${(order?.total - order?.subtotal).toFixed(2) || "0.00"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3}></TableCell>
                <TableCell className="text-right font-medium">Total</TableCell>
                <TableCell className="text-right font-bold">${order?.total?.toFixed(2) || "0.00"}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
      
      {/* Order Timeline/History */}
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>
            Timeline of status updates and notes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isHistoryLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Real order history entries */}
              {orderHistory?.map((entry) => (
                <div key={entry.id} className="flex items-start gap-2">
                  <div className="min-w-[40px] shrink-0">
                    <Badge className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                      {entry.status === "CREATED" ? (
                        <Package className="h-3 w-3" />
                      ) : entry.status === "PAYMENT_CONFIRMED" ? (
                        <Check className="h-3 w-3" />
                      ) : entry.status === "SHIPPED" ? (
                        <Truck className="h-3 w-3" />
                      ) : entry.status === "DELIVERED" ? (
                        <Check className="h-3 w-3" />
                      ) : entry.status === "CANCELLED" ? (
                        <X className="h-3 w-3" />
                      ) : entry.status === "TRACKING_ADDED" ? (
                        <Truck className="h-3 w-3" />
                      ) : (
                        <Package className="h-3 w-3" />
                      )}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {entry.note}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {entry.timestamp ? 
                        format(new Date(entry.timestamp), "MMMM d, yyyy 'at' h:mm a") : 
                        'Unknown date'}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Show a message if no history is available */}
              {(!orderHistory || orderHistory.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No order history available
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}