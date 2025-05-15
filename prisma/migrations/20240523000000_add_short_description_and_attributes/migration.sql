-- AlterTable
ALTER TABLE "Product" ADD COLUMN "short_description" TEXT,
                      ALTER COLUMN "attributes" SET DATA TYPE JSONB; 