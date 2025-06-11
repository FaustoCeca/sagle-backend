-- CreateIndex
CREATE INDEX "idx_game_title" ON "Game"("title");

-- CreateIndex
CREATE INDEX "idx_game_birth_year" ON "Game"("birthYear");

-- CreateIndex
CREATE INDEX "idx_game_image_url" ON "Game"("imageUrl");

-- CreateIndex
CREATE INDEX "idx_game_saga_id" ON "Game"("sagaId");

-- CreateIndex
CREATE INDEX "idx_game_steam_link" ON "Game"("steamLink");

-- CreateIndex
CREATE INDEX "idx_game_votes" ON "Game"("votes");

-- CreateIndex
CREATE INDEX "idx_game_created_at" ON "Game"("createdAt");

-- CreateIndex
CREATE INDEX "idx_saga_title" ON "Saga"("title");

-- CreateIndex
CREATE INDEX "idx_saga_is_the_sagle" ON "Saga"("isTheSagle");

-- CreateIndex
CREATE INDEX "idx_saga_last_time_being_sagle" ON "Saga"("lastTimeBeingSagle");

-- CreateIndex
CREATE INDEX "idx_saga_was_sagle_yesterday" ON "Saga"("wasSagleYesterday");

-- CreateIndex
CREATE INDEX "idx_saga_has_multiplayer" ON "Saga"("hasMultiplayer");

-- CreateIndex
CREATE INDEX "idx_saga_link" ON "Saga"("link");

-- CreateIndex
CREATE INDEX "idx_saga_created_at" ON "Saga"("createdAt");

-- CreateIndex
CREATE INDEX "idx_user_ip_address" ON "User"("ipAddress");

-- CreateIndex
CREATE INDEX "idx_user_last_participation" ON "User"("lastParticipation");

-- CreateIndex
CREATE INDEX "idx_user_has_participated_today" ON "User"("hasParticipatedToday");

-- CreateIndex
CREATE INDEX "idx_user_has_voted_today" ON "User"("hasVotedToday");

-- CreateIndex
CREATE INDEX "idx_user_streak" ON "User"("streak");

-- CreateIndex
CREATE INDEX "idx_user_ids_attempted_today" ON "User"("idsAttemptedToday");
