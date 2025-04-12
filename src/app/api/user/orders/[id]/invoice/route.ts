import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth/auth-options';
import jsPDF from 'jspdf';
// We need to properly import and set up autoTable
import autoTable from 'jspdf-autotable';

// GET /api/user/orders/[id]/invoice
// Generates and returns a PDF invoice for a specific order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const {id}=await params;
    const orderId = id as string; // Ensure orderId is a string
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to download invoices' }, 
        { status: 401 }
      );
    }

    // Get user's email from session
    const userEmail = session.user.email;
    
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found in session' }, 
        { status: 400 }
      );
    }

    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    // Get the specific order
    const order = await prisma.order.findFirst({
      where: { 
        id: orderId,
        userId: user.id // Ensure the order belongs to the authenticated user
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' }, 
        { status: 404 }
      );
    }

    // Create formatted address strings
    const shippingAddress = [
      order.shippingAddressLine1,
      order.shippingAddressLine2,
      `${order.shippingCity}, ${order.shippingState} ${order.shippingPostalCode}`,
      order.shippingCountry
    ].filter(Boolean).join(', ');

    // Company info
    const companyName = 'Tire Shop';
    const companyAddress = '123 Wheel Street, Tireville, CA 12345';
    const companyPhone = '(555) 123-4567';
    const companyEmail = 'info@tireshop.com';

    // Create PDF using jsPDF
    const doc = new jsPDF();
    
    // Add document header
    doc.setFontSize(20);
    doc.text('INVOICE', 105, 20, { align: 'center' });
    
    // Add company info
    doc.setFontSize(14);
    doc.text(companyName, 20, 30);
    doc.setFontSize(10);
    doc.text(companyAddress, 20, 35);
    doc.text(`Phone: ${companyPhone}`, 20, 40);
    doc.text(`Email: ${companyEmail}`, 20, 45);
    
    // Add invoice info
    doc.setFontSize(12);
    doc.text(`Invoice Number: ${order.orderNumber || orderId}`, 20, 55);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 20, 60);
    
    // Add customer info
    const customerName = user.name || userEmail;
      
    doc.setFontSize(14);
    doc.text('Billed To:', 20, 70);
    doc.setFontSize(12);
    doc.text(customerName, 20, 75);
    doc.text(userEmail, 20, 80);
    
    // Shipping address - we need to split long addresses
    const maxWidth = 170;
    const shippingLines = doc.splitTextToSize(shippingAddress, maxWidth);
    let currentLine = 85;
    shippingLines.forEach((line: string | string[]) => {
      doc.text(line, 20, currentLine);
      currentLine += 5;
    });
    
    // Order Items table
    doc.setFontSize(14);
    doc.text('Order Items:', 20, currentLine + 10);
    
    // Create table data
    const tableColumn = ["Item", "Qty", "Unit Price", "Total"];
    const tableRows = order.orderItems.map(item => {
      const itemTotal = item.price * item.quantity;
      return [
        item.product.name,
        item.quantity.toString(),
        `$${item.price.toFixed(2)}`,
        `$${itemTotal.toFixed(2)}`
      ];
    });
    
    // Use the autoTable function directly
    autoTable(doc, {
      startY: currentLine + 15,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [66, 66, 66] },
      margin: { top: 20 }
    });
    
    // Get the final y position to add summary
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Add summary
    doc.text('Subtotal:', 140, finalY);
    doc.text(`$${order.subtotal.toFixed(2)}`, 170, finalY, { align: 'right' });
    
    // Calculate tax (if stored in metadata or calculate based on rules)
    const metadata = order.metadata as any;
    const tax = metadata?.tax || (order.total - order.subtotal);
    if (tax > 0) {
      doc.text('Tax:', 140, finalY + 5);
      doc.text(`$${tax.toFixed(2)}`, 170, finalY + 5, { align: 'right' });
      doc.text('Total:', 140, finalY + 10);
      doc.text(`$${order.total.toFixed(2)}`, 170, finalY + 10, { align: 'right' });
    } else {
      doc.text('Total:', 140, finalY + 5);
      doc.text(`$${order.total.toFixed(2)}`, 170, finalY + 5, { align: 'right' });
    }
    
    // Payment info
    doc.text(`Payment Method: ${order.paymentMethod}`, 20, finalY + 20);
    doc.text(`Payment Status: ${mapPaymentStatus(order.paymentStatus)}`, 20, finalY + 25);
    
    // Footer
    doc.setFontSize(10);
    doc.text('Thank you for your business!', 105, finalY + 40, { align: 'center' });
    
    // Output as buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    // Return the PDF as a blob
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${order.orderNumber || orderId}.pdf"`,
      },
    });
  } catch (error) {
    console.error(`Error generating invoice for order ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to generate invoice', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}

// Helper function to map PaymentStatus enum values to a user-friendly format
function mapPaymentStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'PENDING': 'Pending',
    'PAID': 'Paid',
    'FAILED': 'Failed',
    'REFUNDED': 'Refunded',
    'PARTIALLY_REFUNDED': 'Partially Refunded',
    'CHARGEBACK': 'Chargeback',
    'DISPUTED': 'Disputed',
    'CANCELLED': 'Cancelled'
  };
  return statusMap[status] || status;
}