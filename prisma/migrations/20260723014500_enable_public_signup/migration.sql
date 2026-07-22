ALTER TABLE "SystemSettings"
ALTER COLUMN "publicSignup" SET DEFAULT true;

UPDATE "SystemSettings"
SET "publicSignup" = true
WHERE "publicSignup" = false;
