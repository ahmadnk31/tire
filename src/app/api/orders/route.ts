import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { z } from 'zod';
import { sendOrderConfirmationEmail } from '@/lib/aws/ses-utils';
import { randomUUID } from 'crypto';
import { OrderStatus, PaymentStatus } from '@prisma/client';

// Order creation schema validation
const orderSchema = z.object({
  shippingAddress: z.string().min(5, 'Shipping address must be at least 5 characters'),
  billingAddress: z.string().min(5, 'Billing address must be at least 5 characters'),
  paymentMethod: z.string().min(2, 'Payment method must be specified'),
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Product ID is required'),
      quantity: z.number().min(1, 'Quantity must be at least 1'),
    })
  ).min(1, 'At least one item is required'),
});

// GET orders for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only allow admin or retailer to access order data
    if (session.user.role !== 'ADMIN' && session.user.role !== 'RETAILER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') as OrderStatus | 'ALL' | null;
    const paymentStatus = searchParams.get('paymentStatus') as PaymentStatus | null;
    const search = searchParams.get('search');

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build filter conditions
    const where: any = {};
    
    // Retailer can only see their own orders
    if (session.user.role === 'RETAILER') {
      where.userId = session.user.id;
    }
    
    // Apply status filter if provided and not "ALL"
    if (status && status !== "ALL") {
      where.status = status;
    }
    
    // Apply payment status filter if provided
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }
    
    // Apply search filter if provided
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { shippingCity: { contains: search, mode: 'insensitive' } },
        { shippingCountry: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Query orders with count
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                },
              },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    // Map orders to response format
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: order.total,
      subtotal: order.subtotal,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      isRetailerOrder: order.isRetailerOrder,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      customer: {
        id: order?.user?.id,
        name: order?.user?.name,
        email: order?.user?.email,
      },
      itemCount: order.orderItems.length,
      items: order.orderItems.map(item => ({
        id: item.id,
        product: {
          id: item.product.id,
          name: item.product.name,
          image: item.product.images?.[0] || null,
        },
        quantity: item.quantity,
        price: item.price,
      })),
    }));

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      orders: formattedOrders,
      meta: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST a new order
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Validate request body
    const result = orderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { shippingAddress, billingAddress, paymentMethod, items } = result.data;
    
    // Get product details and calculate total
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds
        }
      }
    });
    
    // Check if all products exist and have sufficient stock
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      
      if (!product) {
        return NextResponse.json(
          { error: `Product with ID ${item.productId} not found` },
          { status: 404 }
        );
      }
      
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for product ${product.name}` },
          { status: 400 }
        );
      }
    }
    
    // Calculate total and prepare order items
    let total = 0;
    const orderItems = items.map(item => {
      const product = products.find(p => p.id === item.productId)!;
      const price = product.retailPrice * (1 - product.discount / 100);
      const itemTotal = price * item.quantity;
      total += itemTotal;
      
      return {
        productId: item.productId,
        quantity: item.quantity,
        price
      };
    });
    
    // Generate a unique order number
    const orderNumber = `ORD-${Date.now().toString().substring(7)}-${randomUUID().substring(0, 4)}`;
    
    // Create the order with transaction to ensure atomicity
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: session.user.id,
          total,
          subtotal: total, // Added required subtotal
          shippingAddressLine1: shippingAddress,
          shippingAddressLine2: body.shippingAddressLine2,
          shippingCity: body.shippingCity || "", // Added required field
          shippingState: body.shippingState || "", // Added required field
          shippingPostalCode: body.shippingPostalCode || "", // Added required field
          shippingCountry: body.shippingCountry || "", // Added required field
          billingAddress,
          paymentMethod,
          orderItems: {
            create: orderItems
          }
        },
        include: {
          orderItems: {
            include: {
              product: true
            }
          },
          user: true
        }
      });
      
      // Update product stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }
      
      return newOrder;
    });
    
    // Send order confirmation email
    try {
      if (order.userId) { // Check if userId exists and is not null
        const user = await prisma.user.findUnique({
          where: { id: order.userId }
        });
        
        if (user) {
          await sendOrderConfirmationEmail(
            user.email,
            user.name,
            order.orderNumber,
            order.total
          );
        }
      }
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
      // Continue even if email fails
    }
    
    return NextResponse.json(order, { status: 201 });
    
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}