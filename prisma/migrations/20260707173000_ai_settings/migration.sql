CREATE TYPE "AIProvider" AS ENUM ('NONE', 'ANTHROPIC', 'OPENAI', 'CUSTOM');

CREATE TABLE "AISettings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "provider" "AIProvider" NOT NULL DEFAULT 'NONE',
    "encryptedApiKey" TEXT,
    "customUrl" TEXT,
    "model" TEXT,
    "allowParseTasks" BOOLEAN NOT NULL DEFAULT true,
    "allowReorder" BOOLEAN NOT NULL DEFAULT false,
    "allowSuggestEnergy" BOOLEAN NOT NULL DEFAULT true,
    "allowFullAuto" BOOLEAN NOT NULL DEFAULT false,
    "requestTimeoutSeconds" INTEGER NOT NULL DEFAULT 20,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AISettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AISettings_userId_key" ON "AISettings"("userId");
CREATE INDEX "AISettings_userId_idx" ON "AISettings"("userId");
CREATE INDEX "AISettings_provider_idx" ON "AISettings"("provider");

ALTER TABLE "AISettings"
ADD CONSTRAINT "AISettings_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "AISettings" (
    "id",
    "userId",
    "provider",
    "allowParseTasks",
    "allowReorder",
    "allowSuggestEnergy",
    "allowFullAuto",
    "requestTimeoutSeconds",
    "updatedAt"
)
SELECT
    gen_random_uuid(),
    "id",
    'NONE',
    true,
    false,
    true,
    false,
    20,
    CURRENT_TIMESTAMP
FROM "User"
ON CONFLICT ("userId") DO NOTHING;
