-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_sagaId_fkey";

-- AlterTable
ALTER TABLE "Game" ALTER COLUMN "sagaId" DROP NOT NULL,
ALTER COLUMN "steamLink" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "lastParticipation" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_sagaId_fkey" FOREIGN KEY ("sagaId") REFERENCES "Saga"("id") ON DELETE SET NULL ON UPDATE CASCADE;
