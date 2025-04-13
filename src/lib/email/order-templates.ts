/**
 * Email templates for order-related notifications
 */

interface OrderConfirmationTemplateParams {
  orderNumber: string;
  orderDate: string;
  customerName: string;
  orderTotal: string;
  currency: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  shippingAddress: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    recipient?: string;
  };
  trackingNumber?: string;
  estimatedDelivery?: string;
  siteUrl?: string;
  siteName?: string;
}

/**
 * Generates HTML for order confirmation email
 */
export function getOrderConfirmationHtml({
  orderNumber,
  orderDate,
  customerName,
  orderTotal,
  currency,
  items = [],
  shippingAddress,
  trackingNumber = 'Not yet available',
  estimatedDelivery = 'Processing',
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://arianabanden.be',
  siteName = 'Ariana Banden Centraal BV',
}: OrderConfirmationTemplateParams): string {
  const greeting = customerName ? `Hi ${customerName},` : 'Hi there,';
  const formattedItems = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <strong>${item.name}</strong>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
        ${currency} ${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');
  
  const shippingAddressHtml = `
    ${shippingAddress.recipient || ''}<br>
    ${shippingAddress.addressLine1 || ''}<br>
    ${shippingAddress.addressLine2 ? shippingAddress.addressLine2 + '<br>' : ''}
    ${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.postalCode || ''}<br>
    ${shippingAddress.country || ''}
  `;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      max-width: 180px;
      margin: 0 auto;
    }
    .content {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 5px;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background-color: #f2f2f2;
      text-align: left;
      padding: 12px;
    }
    .order-details {
      margin-bottom: 20px;
      padding: 15px;
      background: #fff;
      border-radius: 5px;
      border: 1px solid #eee;
    }
    .shipping-info {
      margin-bottom: 20px;
      padding: 15px;
      background: #fff;
      border-radius: 5px;
      border: 1px solid #eee;
    }
    .total-row {
      font-weight: bold;
      background-color: #f2f2f2;
    }
    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #0070f3;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="${siteUrl}/logo.png" alt="${siteName}" class="logo">
  </div>
  
  <div class="content">
    <h1>Order Confirmation</h1>
    <p>${greeting}</p>
    <p>Thank you for your order! We've received your order and are working on it right away.</p>
    
    <div class="order-details">
      <h2>Order Details</h2>
      <p><strong>Order Number:</strong> ${orderNumber}</p>
      <p><strong>Order Date:</strong> ${orderDate}</p>
      
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th style="text-align: center;">Quantity</th>
            <th style="text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${formattedItems}
          <tr class="total-row">
            <td colspan="2" style="padding: 12px; text-align: right;"><strong>Total:</strong></td>
            <td style="padding: 12px; text-align: right;">${currency} ${orderTotal}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="shipping-info">
      <h2>Shipping Information</h2>
      <p>
        ${shippingAddressHtml}
      </p>
      <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
      <p><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>
    </div>
    
    <p>You can check your order status anytime by visiting your account dashboard.</p>
    <p>
      <a href="${siteUrl}/dashboard/orders" class="button">View Order</a>
    </p>
  </div>
  
  <div class="footer">
    <p>&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
    <p>
      If you have any questions, please contact our customer service at 
      <a href="mailto:support@arianabanden.be">support@arianabanden.be</a>
    </p>
  </div>
</body>
</html>`;
}

/**
 * Generates plain text version for order confirmation email
 */
export function getOrderConfirmationText({
  orderNumber,
  orderDate,
  customerName,
  orderTotal,
  currency,
  items = [],
  shippingAddress,
  trackingNumber = 'Not yet available',
  estimatedDelivery = 'Processing',
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://arianabanden.be',
  siteName = 'Ariana Banden Centraal BV',
}: OrderConfirmationTemplateParams): string {
  const greeting = customerName ? `Hi ${customerName},` : 'Hi there,';
  
  const itemsList = items.map(item => 
    `- ${item.name} x${item.quantity}: ${currency} ${(item.price * item.quantity).toFixed(2)}`
  ).join('\n');
  
  const shippingAddressText = `
${shippingAddress.recipient || ''}
${shippingAddress.addressLine1 || ''}
${shippingAddress.addressLine2 || ''}
${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.postalCode || ''}
${shippingAddress.country || ''}
  `;
  
  return `
${siteName} - ORDER CONFIRMATION

${greeting}

Thank you for your order! We've received your order and are working on it right away.

ORDER DETAILS
--------------
Order Number: ${orderNumber}
Order Date: ${orderDate}

ITEMS
--------------
${itemsList}

TOTAL: ${currency} ${orderTotal}

SHIPPING INFORMATION
--------------
${shippingAddressText}

Tracking Number: ${trackingNumber}
Estimated Delivery: ${estimatedDelivery}

You can check your order status anytime by visiting your account dashboard:
${siteUrl}/dashboard/orders

If you have any questions, please contact our customer service at support@arianabanden.be

© ${new Date().getFullYear()} ${siteName}. All rights reserved.
`;
}
