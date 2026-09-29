-- Corrective backfill: re-derive social_support.subtype for followups.
-- followup/update previously changed followup.medium without rewriting the
-- denormalized social_support.subtype, so any followup edited since the column
-- was added (20251105151817_add_social_support_subtype) may be stale.
-- Help-request and housing subtypes cannot drift (their sources are immutable),
-- so only followups need re-deriving. Idempotent: touches only drifted rows.
UPDATE social_support
SET subtype = followup.medium
FROM followup
WHERE followup.social_support_id = social_support.id
  AND social_support.subtype IS DISTINCT FROM followup.medium;
