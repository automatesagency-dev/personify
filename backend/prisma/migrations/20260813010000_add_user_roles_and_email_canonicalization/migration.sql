-- Refuse to apply until legacy case/whitespace duplicates are resolved.  An
-- automatic merge could destroy a legitimate account, so the deployment must
-- stop safely rather than pick a winner.
DO $$
DECLARE
  duplicate_email TEXT;
BEGIN
  SELECT LOWER(BTRIM("email"))
  INTO duplicate_email
  FROM "User"
  GROUP BY LOWER(BTRIM("email"))
  HAVING COUNT(*) > 1
  LIMIT 1;

  IF duplicate_email IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot canonicalize duplicate user email: %. Resolve or remove the duplicate account before applying this migration.', duplicate_email;
  END IF;
END $$;

-- Canonical form eliminates case/whitespace login aliases before the unique
-- index is created.
UPDATE "User"
SET "email" = LOWER(BTRIM("email"))
WHERE "email" <> LOWER(BTRIM("email"));

-- Make authorization independent from mutable profile data. Only the three
-- confirmed existing administrators are promoted during this one-time migration.
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';

UPDATE "User"
SET "role" = 'admin'
WHERE "email" IN (
  'admin@automatesagency.com',
  'joanne@automatesagency.com',
  'dan@automatesagency.com'
);

-- PostgreSQL's regular unique constraint is case-sensitive.  All new writes
-- are normalized in the application, while this index also protects against
-- concurrent or out-of-band writes that differ only by email casing.
CREATE UNIQUE INDEX "User_email_lowercase_key" ON "User" (LOWER(BTRIM("email")));
