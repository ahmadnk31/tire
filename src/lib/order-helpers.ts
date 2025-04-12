import { prisma } from "./db";

/**
 * Generates a unique order number with the format "ORD-{YEAR}{MONTH}{DAY}-{5 random digits}"
 * E.g., ORD-20250407-12345
 */
export async function getOrderNumber(): Promise<string> {
  // Create date-based prefix
  const now = new Date();
  const year = now.getFullYear();
  // Format month and day to ensure they are always 2 digits
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePart = `${year}${month}${day}`;
  
  // Keep generating until we find a unique order number
  let isUnique = false;
  let orderNumber = '';
  
  while (!isUnique) {
    // Generate 5 random digits
    const randomPart = Math.floor(10000 + Math.random() * 90000).toString();
    orderNumber = `ORD-${datePart}-${randomPart}`;
    
    // Check if this order number already exists
    const existingOrder = await prisma.order.findFirst({
      where: {
        orderNumber: orderNumber
      }
    });
    
    if (!existingOrder) {
      isUnique = true;
    }
  }
  
  return orderNumber;
}