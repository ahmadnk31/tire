-- Rename the conflicting billingAddress string column to billingAddressLine
ALTER TABLE IF EXISTS "PaymentMethod" 
RENAME COLUMN "billingAddress" TO "billingAddressLine";
