-- Partial index: speeds up first-followup stats count
-- CreateIndex
CREATE INDEX "followup_social_support_id_first_followup_idx" ON "followup"("social_support_id") WHERE "first_followup" = true;

-- Partial index: speeds up walk-in session stats count
-- CreateIndex
CREATE INDEX "followup_social_support_id_is_during_walk_in_session_idx" ON "followup"("social_support_id") WHERE "is_during_walk_in_session" = true;
