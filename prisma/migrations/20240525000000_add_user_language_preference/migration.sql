-- CreateEnum
CREATE TYPE "UserLanguagePreference" AS ENUM ('en', 'nl');

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferredLanguage" "UserLanguagePreference" NOT NULL DEFAULT 'en';
