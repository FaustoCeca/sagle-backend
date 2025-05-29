-- CreateTable
CREATE TABLE "Saga" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "isTheSagle" BOOLEAN NOT NULL DEFAULT false,
    "lastTimeBeingSagle" TIMESTAMP(3),
    "hasMultiplayer" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Saga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtStyles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ArtStyles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Perspective" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Perspective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "birthYear" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sagaId" INTEGER NOT NULL,
    "steamLink" TEXT NOT NULL,
    "votes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "lastParticipation" TIMESTAMP(3) NOT NULL,
    "hasParticipatedToday" BOOLEAN NOT NULL DEFAULT false,
    "hasVotedToday" BOOLEAN NOT NULL DEFAULT false,
    "streak" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ArtStylesToSaga" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ArtStylesToSaga_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PerspectiveToSaga" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_PerspectiveToSaga_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CategoryToSaga" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CategoryToSaga_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Saga_title_key" ON "Saga"("title");

-- CreateIndex
CREATE UNIQUE INDEX "ArtStyles_name_key" ON "ArtStyles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Perspective_name_key" ON "Perspective"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Game_title_key" ON "Game"("title");

-- CreateIndex
CREATE UNIQUE INDEX "User_ipAddress_key" ON "User"("ipAddress");

-- CreateIndex
CREATE INDEX "_ArtStylesToSaga_B_index" ON "_ArtStylesToSaga"("B");

-- CreateIndex
CREATE INDEX "_PerspectiveToSaga_B_index" ON "_PerspectiveToSaga"("B");

-- CreateIndex
CREATE INDEX "_CategoryToSaga_B_index" ON "_CategoryToSaga"("B");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_sagaId_fkey" FOREIGN KEY ("sagaId") REFERENCES "Saga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtStylesToSaga" ADD CONSTRAINT "_ArtStylesToSaga_A_fkey" FOREIGN KEY ("A") REFERENCES "ArtStyles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtStylesToSaga" ADD CONSTRAINT "_ArtStylesToSaga_B_fkey" FOREIGN KEY ("B") REFERENCES "Saga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PerspectiveToSaga" ADD CONSTRAINT "_PerspectiveToSaga_A_fkey" FOREIGN KEY ("A") REFERENCES "Perspective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PerspectiveToSaga" ADD CONSTRAINT "_PerspectiveToSaga_B_fkey" FOREIGN KEY ("B") REFERENCES "Saga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToSaga" ADD CONSTRAINT "_CategoryToSaga_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToSaga" ADD CONSTRAINT "_CategoryToSaga_B_fkey" FOREIGN KEY ("B") REFERENCES "Saga"("id") ON DELETE CASCADE ON UPDATE CASCADE;
