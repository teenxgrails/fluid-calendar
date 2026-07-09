ALTER TYPE "AIProvider" ADD VALUE IF NOT EXISTS 'GROK';
ALTER TYPE "AIProvider" ADD VALUE IF NOT EXISTS 'GLM';

ALTER TABLE "AISettings"
ADD COLUMN IF NOT EXISTS "encryptedAnthropicKey" TEXT,
ADD COLUMN IF NOT EXISTS "encryptedOpenAIKey" TEXT,
ADD COLUMN IF NOT EXISTS "encryptedGrokKey" TEXT,
ADD COLUMN IF NOT EXISTS "encryptedGlmKey" TEXT,
ADD COLUMN IF NOT EXISTS "soulPreset" TEXT NOT NULL DEFAULT 'business';

UPDATE "AISettings"
SET
  "encryptedAnthropicKey" = CASE WHEN "provider" = 'ANTHROPIC' THEN "encryptedApiKey" ELSE "encryptedAnthropicKey" END,
  "encryptedOpenAIKey" = CASE WHEN "provider" = 'OPENAI' THEN "encryptedApiKey" ELSE "encryptedOpenAIKey" END
WHERE "encryptedApiKey" IS NOT NULL;
