/*
  Warnings:

  - Made the column `sagaId` on table `Game` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_sagaId_fkey";

-- AlterTable
ALTER TABLE "Game" ALTER COLUMN "sagaId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_sagaId_fkey" FOREIGN KEY ("sagaId") REFERENCES "Saga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
