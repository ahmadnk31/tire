-- Create Testimonial table
CREATE TABLE "Testimonial" (
  "id" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "customerTitle" TEXT,
  "customerImage" TEXT,
  "content" TEXT NOT NULL,
  "rating" INTEGER NOT NULL DEFAULT 5,
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);
