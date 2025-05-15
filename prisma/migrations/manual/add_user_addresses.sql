-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('SHIPPING', 'BILLING', 'BOTH');

-- Create UserAddress table
CREATE TABLE "UserAddress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "addressType" "AddressType" NOT NULL DEFAULT 'SHIPPING',
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "addressLine1" TEXT NOT NULL,
  "addressLine2" TEXT,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "postalCode" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "countryCode" TEXT,
  "phoneNumber" TEXT,
  "company" TEXT,
  "deliveryInstructions" TEXT,
  "validated" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserAddress_pkey" PRIMARY KEY ("id")
);

-- Create indexes for faster lookups
CREATE INDEX "UserAddress_userId_idx" ON "UserAddress"("userId");
CREATE INDEX "UserAddress_addressType_idx" ON "UserAddress"("addressType");

-- Add foreign key constraint
ALTER TABLE "UserAddress" ADD CONSTRAINT "UserAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Modify PaymentMethod table to add stripePaymentMethodId and fingerprint fields
ALTER TABLE "PaymentMethod" ADD COLUMN "stripePaymentMethodId" TEXT;
ALTER TABLE "PaymentMethod" ADD COLUMN "fingerprint" TEXT;
ALTER TABLE "PaymentMethod" ADD COLUMN "billingAddressId" TEXT;

-- Create index on stripePaymentMethodId for faster lookups
CREATE INDEX "PaymentMethod_stripePaymentMethodId_idx" ON "PaymentMethod"("stripePaymentMethodId");

-- Add foreign key constraint for billingAddressId
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_billingAddressId_fkey" FOREIGN KEY ("billingAddressId") REFERENCES "UserAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add a shipping and billing address relation to the Order table
ALTER TABLE "Order" ADD COLUMN "shippingAddressId" TEXT;
ALTER TABLE "Order" ADD COLUMN "billingAddressId" TEXT;

-- Add foreign key constraints for the Order table
ALTER TABLE "Order" ADD CONSTRAINT "Order_shippingAddressId_fkey" FOREIGN KEY ("shippingAddressId") REFERENCES "UserAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_billingAddressId_fkey" FOREIGN KEY ("billingAddressId") REFERENCES "UserAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;
