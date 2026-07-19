ALTER TABLE "UserCustomization"
ALTER COLUMN "backgroundTint" SET DEFAULT '#0E0E10';

UPDATE "UserCustomization"
SET "backgroundTint" = '#0E0E10'
WHERE LOWER("backgroundTint") IN ('#1a1d1e', '#1b1d1e');
