import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { format } from 'date-fns';
import { SendRawEmailCommand } from '@aws-sdk/client-ses';
import { sesClient } from '@/lib/aws/ses-client';

const fromEmail = process.env.SES_FROM_EMAIL || 'no-reply@yourtirestore.com';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const orderId = params.id;
    
    // Get data from request body including the PDF content
    const { email, pdfBase64 } = await request.json();
    
    if (!pdfBase64) {
      return NextResponse.json(
        { error: 'PDF data is required' },
        { status: 400 }
      );
    }
    
    // Build query - different access levels based on user role
    let where = { id: orderId };
    
    // Regular users and retailers can only see their own orders
    if (session.user.role === 'USER' || session.user.role === 'RETAILER') {
      where = {
        ...where,
        id: session.user.id
      };
    }
    
    const order = await prisma.order.findUnique({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Get email to send to - use custom email if provided, otherwise use customer's email
    const recipientEmail = email || order.user.email;
    const orderDate = format(new Date(order.createdAt), 'MMMM d, yyyy');
    
    // Create a boundary for the multipart message
    const boundary = 'NextJSInvoiceBoundary';
    
    // Create a simple text version of the message
    const textContent = `
      Invoice for Order #${order.orderNumber}
      
      Thank you for your order from ${orderDate}.
      
      Please find your invoice attached to this email as a PDF.
      
      If you have any questions about your order, please contact our customer service.
      
      Best regards,
      The Tire Shop Team
    `;
    
    // Create email HTML content
    const emailHtml = `
      <html>
        <body>
          <h1>Your Invoice</h1>
          <p>Hello ${order.user.name},</p>
          <p>Thank you for your order. Please find your invoice attached to this email as a PDF document.</p>
          <p>If you have any questions about your order, please contact our customer service.</p>
          <p>Best regards,<br>The Tire Shop Team</p>
        </body>
      </html>
    `;
    
    // Create the PDF attachment
    const attachmentFilename = `invoice-${order.orderNumber}.pdf`;
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    
    // Create multipart message with PDF attachment
    const message = `From: ${fromEmail}
To: ${recipientEmail}
Subject: Invoice for Order #${order.orderNumber}
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="${boundary}"

--${boundary}
Content-Type: multipart/alternative; boundary="alt-${boundary}"

--alt-${boundary}
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: 7bit

${textContent}

--alt-${boundary}
Content-Type: text/html; charset=UTF-8
Content-Transfer-Encoding: 7bit

${emailHtml}

--alt-${boundary}--

--${boundary}
Content-Type: application/pdf
Content-Disposition: attachment; filename="${attachmentFilename}"
Content-Transfer-Encoding: base64

${pdfBase64}

--${boundary}--`;
    
    // Send email using AWS SES raw message
    const command = new SendRawEmailCommand({
      Source: fromEmail,
      Destinations: [recipientEmail],
      RawMessage: {
        Data: Buffer.from(message),
      },
    });
    
    await sesClient.send(command);
    
    return NextResponse.json({ success: true });
    
  } catch (error: unknown) {
    console.error('Error sending invoice email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to send invoice email', details: errorMessage },
      { status: 500 }
    );
  }
}