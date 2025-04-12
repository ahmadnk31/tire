import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client with error logging
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error', 'warn'],
  });
};

// Define the global for type safety
declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Create or reuse a Prisma client instance
export const prisma = globalThis.prisma ?? prismaClientSingleton();

// In development, attach to the global object to prevent multiple instances
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;