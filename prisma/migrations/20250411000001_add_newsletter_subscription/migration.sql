-- Newsletter table for storing subscriber information
CREATE TABLE "Newsletter" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "source" TEXT DEFAULT 'website',
  "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "unsubscribedAt" TIMESTAMP(3),

  CONSTRAINT "Newsletter_pkey" PRIMARY KEY ("id")
);

-- Create unique index on email to prevent duplicates
CREATE UNIQUE INDEX "Newsletter_email_key" ON "Newsletter"("email");
