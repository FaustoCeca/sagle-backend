-- CreateTable
CREATE TABLE "Hint" (
    "id" SERIAL NOT NULL,
    "sagaId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hint_sagaId_key" ON "Hint"("sagaId");

-- CreateIndex
CREATE INDEX "idx_hint_saga_id" ON "Hint"("sagaId");

-- CreateIndex
CREATE INDEX "idx_hint_created_at" ON "Hint"("createdAt");

-- AddForeignKey
ALTER TABLE "Hint" ADD CONSTRAINT "Hint_sagaId_fkey" FOREIGN KEY ("sagaId") REFERENCES "Saga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
