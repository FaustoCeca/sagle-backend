-- AlterTable
ALTER TABLE "User" ADD COLUMN     "idsAttemptedToday" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
