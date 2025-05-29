/*
  Warnings:

  - Added the required column `imageUrl` to the `Saga` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Saga" ADD COLUMN     "imageUrl" TEXT NOT NULL;
