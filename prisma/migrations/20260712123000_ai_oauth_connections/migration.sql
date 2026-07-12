CREATE TABLE "AIOAuthConnection" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "provider" "AIProvider" NOT NULL,
    "encryptedAccessToken" TEXT NOT NULL,
    "encryptedRefreshToken" TEXT,
    "tokenType" TEXT,
    "scope" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIOAuthConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIOAuthState" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "provider" "AIProvider" NOT NULL,
    "stateHash" TEXT NOT NULL,
    "encryptedCodeVerifier" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIOAuthState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AIOAuthConnection_userId_provider_key"
ON "AIOAuthConnection"("userId", "provider");
CREATE INDEX "AIOAuthConnection_userId_idx" ON "AIOAuthConnection"("userId");
CREATE UNIQUE INDEX "AIOAuthState_stateHash_key" ON "AIOAuthState"("stateHash");
CREATE INDEX "AIOAuthState_userId_provider_idx" ON "AIOAuthState"("userId", "provider");
CREATE INDEX "AIOAuthState_expiresAt_idx" ON "AIOAuthState"("expiresAt");

ALTER TABLE "AIOAuthConnection"
ADD CONSTRAINT "AIOAuthConnection_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AIOAuthState"
ADD CONSTRAINT "AIOAuthState_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
