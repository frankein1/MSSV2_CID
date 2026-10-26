-- followup.update previously changed followup.medium without rewriting the
-- denormalized social_support.subtype, so any followup edited since the column
-- was added may be stale.
UPDATE social_support ss
SET subtype = f.medium
FROM followup f
WHERE f.social_support_id = ss.id
AND ss.subtype IS DISTINCT FROM f.medium::text; -- cast Enum to text for comparison
