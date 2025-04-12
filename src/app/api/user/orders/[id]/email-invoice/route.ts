import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth/auth-options';
import PDFDocument from 'pdfkit';
import { SES, SendRawEmailCommand } from '@aws-sdk/client-ses';

// Configure AWS SES
const ses = new SES({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

// POST /api/user/orders/[id]/email-invoice
// Emails a PDF invoice for a specific order
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const {id} = params;
    const orderId = id;
    const { email } = await request.json();
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be signed in to email invoices' }, 
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

    // Create a PDF document and collect chunks properly
    return new Promise<NextResponse>((resolve, reject) => {
      try {
        const chunks: Buffer[] = [];
        const doc = new PDFDocument({ margin: 50 });

        // Collect the PDF data in chunks
        doc.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        doc.on('end', async () => {
          try {
            // Combine PDF chunks into a single buffer
            const pdfBuffer = Buffer.concat(chunks);
            const pdfBase64 = pdfBuffer.toString('base64');
            
            // Company info
            const companyName = 'Tire Shop';
            
            // Generate a unique boundary for the email
            const boundary = `----=_NextPart_${Math.random().toString(36).substring(2)}`;
            
            // Prepare customer name
            const customerName = user.name || userEmail;
            
            // Send the email with the PDF attachment using AWS SES
            const emailTo = email || userEmail;
            
            const emailContent = [
              // Email headers
              `From: ${companyName} <${process.env.SES_SENDER_EMAIL || 'noreply@tireshop.com'}>`,
              `To: ${emailTo}`,
              `Subject: Your Invoice for Order #${order.orderNumber || orderId}`,
              'MIME-Version: 1.0',
              `Content-Type: multipart/mixed; boundary="${boundary}"`,
              '',
              
              // HTML part
              `--${boundary}`,
              'Content-Type: text/html; charset=utf-8',
              '',
              `<html>
                <body>
                  <h1>Invoice for Order #${order.orderNumber || orderId}</h1>
                  <p>Dear ${customerName},</p>
                  <p>Thank you for your order! Please find your invoice attached.</p>
                  <p>Order Total: $${order.total.toFixed(2)}</p>
                  <p>If you have any questions about your order, please contact our customer service.</p>
                  <p>Best regards,<br>${companyName} Team</p>
                </body>
              </html>`,
              '',
              
              // PDF attachment
              `--${boundary}`,
              'Content-Type: application/pdf',
              `Content-Disposition: attachment; filename="invoice-${order.orderNumber || orderId}.pdf"`,
              'Content-Transfer-Encoding: base64',
              '',
              pdfBase64,
              '',
              
              // End boundary
              `--${boundary}--`
            ].join('\r\n');
            
            // Send using the SendRawEmailCommand
            const command = new SendRawEmailCommand({
              RawMessage: { 
                Data: Buffer.from(emailContent)
              }
            });
            
            await ses.send(command);
            
            // Update order with customer email if it was provided
            if (email && order.metadata) {
              const updatedMetadata = { 
                ...order.metadata as object,
                customerEmail: email 
              };
              
              await prisma.order.update({
                where: { id: orderId },
                data: { metadata: updatedMetadata }
              });
            }
            
            resolve(NextResponse.json({
              success: true,
              message: `Invoice has been emailed to ${emailTo}`
            }));
          } catch (error) {
            console.error(`Error in email sending: ${error}`);
            resolve(NextResponse.json(
              { 
                success: false,
                error: 'Failed to email invoice',
                message: error instanceof Error ? error.message : 'Unknown error'
              }, 
              { status: 500 }
            ));
          }
        });
        
        // Handle any error during PDF generation
        doc.on('error', (err) => {
          console.error('PDF generation error:', err);
          reject(err);
        });
        
        // Company info
        const companyName = 'Tire Shop';
        const companyAddress = '123 Wheel Street, Tireville, CA 12345';
        const companyPhone = '(555) 123-4567';
        const companyEmail = 'info@tireshop.com';
        
        // Add document header
        doc.fontSize(20).text('INVOICE', { align: 'center' });
        doc.moveDown();
        
        // Add company info
        doc.fontSize(14).text(companyName, { align: 'left' });
        doc.fontSize(10).text(companyAddress);
        doc.fontSize(10).text(`Phone: ${companyPhone}`);
        doc.fontSize(10).text(`Email: ${companyEmail}`);
        doc.moveDown();
        
        // Add invoice info
        doc.fontSize(12).text(`Invoice Number: ${order.orderNumber || orderId}`);
        doc.fontSize(12).text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
        doc.moveDown();
        
        // Add customer info - no longer using profile which doesn't exist in schema
        const customerName = user.name || userEmail;
          
        doc.fontSize(14).text('Billed To:', { underline: true });
        doc.fontSize(12).text(customerName);
        doc.fontSize(12).text(userEmail);
        doc.fontSize(12).text(shippingAddress);
        doc.moveDown();
        
        // Create table header manually - avoiding autoTable which isn't available in PDFKit
        doc.fontSize(14).text('Order Items:', { underline: true });
        doc.moveDown(0.5);
        
        // Draw table headers
        const startX = 50;
        let currentY = doc.y;
        const columnPositions = {
          item: startX,
          quantity: 300,
          unitPrice: 350,
          total: 450
        };
        
        // Table header
        doc.fontSize(10);
        doc.text('Item', columnPositions.item, currentY);
        doc.text('Qty', columnPositions.quantity, currentY);
        doc.text('Unit Price', columnPositions.unitPrice, currentY);
        doc.text('Total', columnPositions.total, currentY);
        
        currentY += 15; // Move down after header
        
        // Draw a line for header separation
        doc.moveTo(startX, currentY)
           .lineTo(550, currentY)
           .stroke();
        
        currentY += 10; // Add some space after the line
        
        // Table items
        order.orderItems.forEach(item => {
          const itemTotal = item.price * item.quantity;
          
          doc.fontSize(10);
          doc.text(item.product.name, columnPositions.item, currentY);
          doc.text(item.quantity.toString(), columnPositions.quantity, currentY);
          doc.text(`$${item.price.toFixed(2)}`, columnPositions.unitPrice, currentY);
          doc.text(`$${itemTotal.toFixed(2)}`, columnPositions.total, currentY);
          
          currentY += 20; // Move down for next row
        });
        
        // Draw total line
        currentY += 10;
        doc.moveTo(columnPositions.unitPrice, currentY)
           .lineTo(550, currentY)
           .stroke();
        
        currentY += 10;
        
        // Subtotal
        doc.fontSize(10);
        doc.text('Subtotal:', columnPositions.unitPrice, currentY);
        doc.text(`$${order.subtotal.toFixed(2)}`, columnPositions.total, currentY);
        
        currentY += 15;
        
        // Calculate tax (if stored in metadata or calculate based on rules)
        const metadata = order.metadata as any;
        const tax = metadata?.tax || (order.total - order.subtotal);
        if (tax > 0) {
          doc.text('Tax:', columnPositions.unitPrice, currentY);
          doc.text(`$${tax.toFixed(2)}`, columnPositions.total, currentY);
          currentY += 15;
        }
        
        // Total amount
        doc.fontSize(12);
        doc.text('Total:', columnPositions.unitPrice, currentY);
        doc.text(`$${order.total.toFixed(2)}`, columnPositions.total, currentY);
        
        // Payment info
        currentY += 30;
        doc.fontSize(12).text(`Payment Method: ${order.paymentMethod}`);
        doc.fontSize(12).text(`Payment Status: ${mapPaymentStatus(order.paymentStatus)}`);
        
        // Footer
        doc.moveDown(2);
        doc.fontSize(10).text('Thank you for your business!', { align: 'center' });
        
        // Finalize the PDF
        doc.end();
        
      } catch (pdfError) {
        console.error('Error during PDF setup:', pdfError);
        resolve(NextResponse.json(
          { 
            success: false,
            error: 'Failed to generate invoice PDF',
            message: pdfError instanceof Error ? pdfError.message : 'Unknown error' 
          },
          { status: 500 }
        ));
      }
    });
  } catch (error) {
    console.error(`Error emailing invoice for order ${params.id}:`, error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to email invoice',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
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