import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { $Enums } from '@prisma/client';
import { JsonValue } from '@prisma/client/runtime/library';

// Simple HTML template for invoice
const generateInvoiceHTML = (order: { user: { name: string; id: string; email: string; }; orderItems: ({ product: { name: string; id: string; brand: { name: string; id: string; }; sku: string | null; width: number; aspectRatio: number; rimDiameter: number; images: string[]; }; } & { id: string; orderId: string; productId: string; quantity: number; price: number; isWholesalePrice: boolean; })[]; } & { status: $Enums.OrderStatus; id: string; createdAt: Date; updatedAt: Date; userId: string; orderNumber: string; total: number; subtotal: number; isRetailerOrder: boolean; trackingNumber: string | null; trackingUrl: string | null; metadata: JsonValue | null; shippingAddressLine1: string; shippingAddressLine2: string | null; shippingCity: string; shippingState: string; shippingPostalCode: string; shippingCountry: string; billingAddress: string; paymentMethod: string; paymentStatus: $Enums.PaymentStatus; }) => {
  const orderItems = order.orderItems.map(item => {
    const productName = `${item.product.brand.name} ${item.product.name} ${item.product.width}/${item.product.aspectRatio}R${item.product.rimDiameter}`;
    return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${productName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  // Calculate tax (assuming it's the difference between total and subtotal)
  const tax = order.total - order.subtotal;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice #${order.orderNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
          font-size: 14px;
          line-height: 1.5;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 30px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .header p {
          margin: 5px 0 0 0;
        }
        .info-section {
          margin-bottom: 20px;
        }
        .info-section h2 {
          margin: 0 0 10px 0;
          font-size: 16px;
        }
        .info-section p {
          margin: 0 0 5px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th {
          background-color: #f5f5f5;
          padding: 10px 8px;
          text-align: left;
          border-bottom: 2px solid #ddd;
        }
        td {
          padding: 8px;
          border-bottom: 1px solid #ddd;
        }
        .text-right {
          text-align: right;
        }
        .totals {
          margin-top: 20px;
          text-align: right;
        }
        .totals p {
          margin: 5px 0;
        }
        .bold {
          font-weight: bold;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #777;
        }
        .print-button {
          margin-top: 20px;
          text-align: center;
        }
        .print-button button {
          padding: 8px 16px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        @media print {
          .print-button {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <h1>INVOICE</h1>
          <p>Tire Shop</p>
        </div>
        
        <div class="info-section">
          <h2>Invoice Details</h2>
          <p><strong>Invoice Number:</strong> ${order.orderNumber}</p>
          <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        
        <div class="info-section">
          <h2>Customer Information</h2>
          <p><strong>Name:</strong> ${order.user.name}</p>
          <p><strong>Email:</strong> ${order.user.email}</p>
        </div>
        
        <div class="info-section">
          <h2>Shipping Address</h2>
          <p>${order.shippingAddressLine1}</p>
          ${order.shippingAddressLine2 ? `<p>${order.shippingAddressLine2}</p>` : ''}
          <p>${order.shippingCity}, ${order.shippingState} ${order.shippingPostalCode}</p>
          <p>${order.shippingCountry}</p>
        </div>
        
        <div class="info-section">
          <h2>Order Items</h2>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th class="text-right">Price</th>
                <th class="text-right">Quantity</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${orderItems}
            </tbody>
          </table>
        </div>
        
        <div class="totals">
          <p><strong>Subtotal:</strong> $${order.subtotal.toFixed(2)}</p>
          <p><strong>Tax:</strong> $${tax.toFixed(2)}</p>
          <p class="bold"><strong>TOTAL:</strong> $${order.total.toFixed(2)}</p>
        </div>
        
        <div class="info-section">
          <h2>Payment Information</h2>
          <p><strong>Method:</strong> ${order.paymentMethod}</p>
          <p><strong>Status:</strong> ${order.paymentStatus}</p>
        </div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>For any questions regarding this invoice, please contact our customer service.</p>
        </div>
        
        <div class="print-button">
          <button onclick="window.print()">Print Invoice</button>
        </div>
      </div>
      
      <script>
        // Auto-print when the page loads
        window.onload = function() {
          // Uncomment this line to automatically print when opening
          // window.print();
        }
      </script>
    </body>
    </html>
  `;
};

export async function GET(
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
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                sku: true,
                width: true,
                aspectRatio: true,
                rimDiameter: true,
                brand: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
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

    // Generate HTML invoice
    const htmlInvoice = generateInvoiceHTML(order);
    
    // Set response headers for HTML
    const headers = new Headers();
    headers.set('Content-Type', 'text/html');
    
    return new NextResponse(htmlInvoice, {
      status: 200,
      headers: headers,
    });
    
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}