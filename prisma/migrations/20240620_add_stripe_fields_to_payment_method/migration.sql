-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('SHIPPING', 'BILLING', 'BOTH');

-- AlterTable
ALTER TABLE "PaymentMethod" 
ADD COLUMN IF NOT EXISTS "stripePaymentMethodId" TEXT,
ADD COLUMN IF NOT EXISTS "billingAddressId" TEXT;

-- Create indices for new PaymentMethod fields
CREATE INDEX IF NOT EXISTS "PaymentMethod_stripePaymentMethodId_idx" ON "PaymentMethod"("stripePaymentMethodId");
CREATE INDEX IF NOT EXISTS "PaymentMethod_billingAddressId_idx" ON "PaymentMethod"("billingAddressId");

-- Add foreign key relation between PaymentMethod and UserAddress
ALTER TABLE "PaymentMethod"
ADD CONSTRAINT "PaymentMethod_billingAddressId_fkey"
FOREIGN KEY ("billingAddressId")
REFERENCES "UserAddress"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
